import logging
import requests
from collections import defaultdict

from django.utils import timezone
from django.conf import settings
from django.core.files.storage import default_storage
from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from misc.services.itn import get_post_similar_articles
from posts.models import (
    Post,
    Vote,
    PostUserSnapshot,
    PostActivityBoost,
)
from posts.serializers import (
    PostFilterSerializer,
    OldQuestionFilterSerializer,
    PostWriteSerializer,
    serialize_post_many,
    serialize_post,
    get_subscription_serializer_by_type,
    PostRelatedArticleSerializer,
    PostUpdateSerializer,
)
from posts.services.common import (
    create_post,
    get_post_permission_for_user,
    approve_post,
    update_post,
    submit_for_review_post,
    post_make_draft,
    compute_hotness,
)
from posts.services.feed import get_posts_feed, get_similar_posts
from posts.services.subscriptions import create_subscription
from posts.utils import check_can_edit_post
from projects.permissions import ObjectPermission
from questions.serializers import (
    QuestionApproveSerializer,
)
from questions.types import AggregationMethod
from questions.models import AggregateForecast, Question
from users.models import User
from utils.files import UserUploadedImage, generate_filename
from utils.frontend import build_question_embed_url
from utils.paginator import CountlessLimitOffsetPagination
from utils.the_math.aggregations import get_aggregation_history
from utils.csv_utils import build_csv


@api_view(["GET"])
@permission_classes([AllowAny])
def posts_list_api_view(request):
    paginator = CountlessLimitOffsetPagination()
    qs = Post.objects.all()

    # Extra params
    with_cp = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("with_cp")
    )
    group_cutoff = (
        serializers.IntegerField(
            allow_null=True, default=3, max_value=3, min_value=0
        ).run_validation(request.query_params.get("group_cutoff"))
        or 3
    )

    # Apply filtering
    filters_serializer = PostFilterSerializer(data=request.query_params)
    filters_serializer.is_valid(raise_exception=True)

    qs = get_posts_feed(qs, user=request.user, **filters_serializer.validated_data)
    # Paginating queryset
    posts = paginator.paginate_queryset(qs, request)

    data = serialize_post_many(
        posts,
        with_cp=with_cp,
        current_user=request.user,
        group_cutoff=group_cutoff,
    )

    return paginator.get_paginated_response(data)


@cache_page(60 * 30)
@api_view(["GET"])
@permission_classes([AllowAny])
def posts_list_homeage_api_view(request):
    """
    Cached view of homepage posts
    """

    qs = get_posts_feed(Post.objects.all(), show_on_homepage=True)

    return Response(serialize_post_many(qs, with_cp=True, group_cutoff=3))


@api_view(["GET"])
@permission_classes([AllowAny])
def posts_list_oldapi_view(request):
    """
    We shared this request example with FAB participants:
    url_qparams = {
        "limit": count,
        "offset": offset,
        "has_group": "false",
        "order_by": "-activity",
        "forecast_type": "binary",
        "project": tournament_id,
        "status": "open",
        "type": "forecast",
        "include_description": "true",
    }
    url = f"{api_info.base_url}/questions/"
    response = requests.get(
        url, headers={"Authorization": f"Token {api_info.token}"}, params=url_qparams
    )

    But we don't want to support all these parameters, and the ones relevant are:
    - order_by
    - status
    - project
    - forecast_type - we ignore this, but assume it's binary - FAB only supports binary for now.
    """

    paginator = LimitOffsetPagination()
    qs = Post.objects.all()

    # Apply filtering
    filters_serializer = OldQuestionFilterSerializer(data=request.query_params)
    filters_serializer.is_valid(raise_exception=True)
    status = filters_serializer.validated_data.pop("status", None)
    projects = filters_serializer.validated_data.pop("project", None)
    guessed_by = filters_serializer.validated_data.pop("guessed_by", None)
    not_guessed_by = filters_serializer.validated_data.pop("not_guessed_by", None)

    qs = get_posts_feed(
        qs,
        user=request.user,
        tournaments=projects,
        statuses=status,
        forecast_type=["binary"],
        forecaster_id=guessed_by,
        not_forecaster_id=not_guessed_by,
        **filters_serializer.validated_data,
    )
    # Paginating queryset
    posts = paginator.paginate_queryset(qs, request)

    data = serialize_post_many(
        posts,
        with_cp=True,
        current_user=request.user,
    )

    # Given we limit the feed to binary questions, we expect each post to have a question with a description
    data = [{**d, "description": d["question"]["description"]} for d in data]

    return paginator.get_paginated_response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def post_detail_oldapi_view(request: Request, pk):
    qs = get_posts_feed(qs=Post.objects.all(), ids=[pk], user=request.user)
    posts = serialize_post_many(
        qs,
        current_user=request.user,
        with_cp=True,
        with_subscriptions=True,
    )

    if not posts:
        raise NotFound("Post not found")

    post = posts[0]
    if post.get("question") is not None:
        post["description"] = post["question"].get("description")

    return Response(posts[0])


@api_view(["GET"])
@permission_classes([AllowAny])
def post_detail(request: Request, pk):
    user = request.user if request.user.is_authenticated else None

    # Extra params
    with_cp = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("with_cp", True)
    )

    qs = Post.objects.filter_permission(user=user).filter(pk=pk)
    posts = serialize_post_many(
        qs,
        current_user=request.user,
        with_cp=with_cp,
        with_subscriptions=True,
    )

    if not posts:
        raise NotFound("Post not found")

    return Response(posts[0])


@api_view(["POST"])
def post_create_api_view(request):
    # manually convert scaling to range_min, range_max, zero_point
    # TODO: move scaling handling
    qdatas = []
    qdata = request.data.get("question", None)
    if qdata:
        qdatas.append(qdata)
    qdatas.extend(request.data.get("group_of_questions", {}).get("questions", []))
    for qdata in qdatas:
        scaling = qdata.pop("scaling", {})
        qdata["range_min"] = scaling.get("range_min")
        qdata["range_max"] = scaling.get("range_max")
        qdata["zero_point"] = scaling.get("zero_point")

    serializer = PostWriteSerializer(data=request.data, context={"user": request.user})
    serializer.is_valid(raise_exception=True)
    post = create_post(**serializer.validated_data, author=request.user)

    return Response(
        serialize_post(post, with_cp=False, current_user=request.user),
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def remove_from_project(request, pk):
    post = get_object_or_404(Post, pk=pk)
    check_can_edit_post(post, request.user)

    project_id = request.data["project_id"]
    post.projects.set([x for x in post.projects.all() if x.id != project_id])
    post.save()
    return Response({}, status=status.HTTP_200_OK)


@api_view(["PUT"])
def post_update_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    check_can_edit_post(post, request.user)

    # manually convert scaling to range_min, range_max, zero_point
    # TODO: move scaling handling
    qdatas = []
    qdata = request.data.get("question", None)
    if qdata:
        qdatas.append(qdata)
    qdatas.extend(request.data.get("group_of_questions", {}).get("questions", []))
    for qdata in qdatas:
        scaling = qdata.pop("scaling", {})
        qdata["range_min"] = scaling.get("range_min")
        qdata["range_max"] = scaling.get("range_max")
        qdata["zero_point"] = scaling.get("zero_point")

    serializer = PostUpdateSerializer(
        post, data=request.data, partial=True, context={"user": request.user}
    )
    serializer.is_valid(raise_exception=True)

    post = update_post(post, **serializer.validated_data)

    return Response(
        serialize_post(post, with_cp=False, current_user=request.user),
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def post_approve_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_approve(permission, raise_exception=True)

    serializer = QuestionApproveSerializer(post, data=request.data)
    serializer.is_valid(raise_exception=True)

    approve_post(post, **serializer.validated_data)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def post_submit_for_review_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_submit_for_review(permission, raise_exception=True)

    submit_for_review_post(post)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def post_make_draft_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_submit_for_review(permission, raise_exception=True)

    post_make_draft(post)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["DELETE"])
def post_delete_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_delete(permission, raise_exception=True)

    post.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def post_vote_api_view(request: Request, pk: int):
    post = get_object_or_404(Post, pk=pk)
    direction = serializers.ChoiceField(
        required=False, allow_null=True, choices=Vote.VoteDirection.choices
    ).run_validation(request.data.get("direction"))

    # Deleting existing vote
    Vote.objects.filter(user=request.user, post=post).delete()

    if direction:
        Vote.objects.create(user=request.user, post=post, direction=direction)

    # Update counters
    vote_score = post.update_vote_score()

    return Response({"score": vote_score})


@api_view(["POST"])
def post_view_event_api_view(request: Request, pk: int):
    """
    Mark post view
    """

    post = get_object_or_404(Post, pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    PostUserSnapshot.update_viewed_at(post, request.user)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_image_api_view(request):
    image = request.data["image"]

    image_generator = UserUploadedImage(source=image)
    result = image_generator.generate()

    filename = generate_filename(default_storage, image.name, upload_to="user_uploaded")

    # Save the processed image using the default storage system
    filename = default_storage.save(filename, result, max_length=100)
    file_url = default_storage.url(filename)

    return Response({"url": file_url})


@api_view(["POST"])
def activity_boost_api_view(request, pk):
    """
    Boots/Bury post
    """

    post = get_object_or_404(Post, pk=pk)
    score = serializers.IntegerField().run_validation(request.data.get("score"))

    if not request.user.is_superuser:
        raise PermissionDenied("You do not have permission boost this post")

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    PostActivityBoost.objects.create(user=request.user, post=post, score=score)

    # Recalculate hotness
    compute_hotness()

    return Response(
        {"score_total": PostActivityBoost.get_post_score(pk)},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST", "PUT"])
def post_subscriptions_create(request, pk):
    """
    Create bulk subscriptions for the post
    """

    post = get_object_or_404(Post, pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    existing_subscriptions = post.subscriptions.filter(user=request.user).exclude(
        is_global=True
    )

    # Validating data
    validated_data = []
    keep_ids = set()

    for data in serializers.ListField().run_validation(request.data):
        subscription_type = data.get("type")
        subscription_id = data.pop("id", None)

        serializer = get_subscription_serializer_by_type(subscription_type)(data=data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data.pop("created_at", None)

        # Check changed
        # Check whether subscription was changed
        existing_subscription = next(
            (sub for sub in existing_subscriptions if sub.id == subscription_id),
            None,
        )
        create = not existing_subscription

        if existing_subscription:
            for key, value in data.items():
                if getattr(existing_subscription, key) != value:
                    # Notification was changed, so we want to re-create it
                    create = True
                    break

        if create:
            validated_data.append(data)
        else:
            keep_ids.add(subscription_id)

    # Deleting subscriptions
    existing_subscriptions.exclude(id__in=keep_ids).delete()

    for data in validated_data:
        create_subscription(
            subscription_type=data.pop("type"),
            post=post,
            user=request.user,
            **data,
        )

    return Response(
        [
            get_subscription_serializer_by_type(sub.type)(sub).data
            for sub in existing_subscriptions.all()
        ],
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def all_post_subscriptions(request):
    """
    Returns all post subscriptions of the user
    """

    posts = serialize_post_many(
        Post.objects.filter(
            subscriptions__user=request.user, subscriptions__is_global=False
        ).distinct("pk"),
        with_cp=False,
        current_user=request.user,
        with_subscriptions=True,
    )

    return Response(posts)


@api_view(["GET"])
@permission_classes([AllowAny])
def post_similar_posts_api_view(request: Request, pk):
    post = get_object_or_404(Post, pk=pk)

    # We can omit permissions check
    # since this endpoint does not expose post content
    # permission = get_post_permission_for_user(post, user=request.user)
    # ObjectPermission.can_view(permission, raise_exception=True)

    # Not to overload the redis
    posts = get_similar_posts(post)
    posts = serialize_post_many(posts, with_cp=True, group_cutoff=1)

    return Response(posts)


@api_view(["GET"])
@permission_classes([AllowAny])
def post_related_articles_api_view(request: Request, pk):
    post = get_object_or_404(Post, pk=pk)

    # We can omit permissions check
    # since this endpoint does not expose post content
    # permission = get_post_permission_for_user(post, user=request.user)
    # ObjectPermission.can_view(permission, raise_exception=True)

    # Retrieve cached articles
    articles = get_post_similar_articles(post)

    return Response(PostRelatedArticleSerializer(articles, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def post_preview_image(request: Request, pk):
    post = get_object_or_404(Post, pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    headers = {"api_key": settings.SCREENSHOT_SERVICE_API_KEY}
    width = 1200
    height = 630
    theme = "dark"

    image_url = f"{build_question_embed_url(pk)}/?ENFORCED_THEME_PARAM={theme}&HIDE_ZOOM_PICKER=true&non-interactive=true"

    try:
        response = requests.post(
            f"{settings.SCREENSHOT_SERVICE_API_URL}/",
            json={
                "url": image_url,
                "selector": "#id-used-by-screenshot-donot-change",
                "selector_to_wait": "#id-logo-used-by-screenshot-donot-change",
                "width": width,
                "height": height,
            },
            headers=headers,
        )
        if response.ok:
            image_data = response.content
            return HttpResponse(image_data, content_type="image/png")
        else:
            logging.error(
                "Screenshot service failed status_code=%s response=%s",
                response.status_code,
                response.content.decode("utf-8"),
            )

    except Exception:
        logging.exception("Image generation failed question_id=%s", pk)

    return HttpResponseNotFound(
        "HTTP 404 - Chart for this question cannot be generated."
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def download_csv(request, pk: int):
    post = get_object_or_404(Post, pk=pk)
    user: User = request.user

    # Check permissions
    permission = get_post_permission_for_user(post, user=user)
    ObjectPermission.can_view(permission, raise_exception=True)

    # Get question
    if post.group_of_questions:
        question_id = request.GET.get("sub-question", None)
        if question_id is None:
            questions = list(post.group_of_questions.questions.all())
        else:
            questions = list(post.group_of_questions.questions.filter(pk=question_id))
            if not questions:
                raise NotFound(f"Sub-question with id {question_id} not found.")
    elif post.conditional:
        questions = [post.conditional.question_yes, post.conditional.question_no]
    else:  # post.question
        questions = [post.question]

    # get and validate aggregation_methods
    aggregation_methods = request.GET.get("aggregation_methods", "recency_weighted")
    if aggregation_methods == "all":
        aggregation_methods = None
    if aggregation_methods:
        aggregation_methods: list[AggregationMethod] = aggregation_methods.split(",")
        for method in aggregation_methods:
            if method not in AggregationMethod.values:
                raise PermissionDenied(f"Invalid aggregation method: {method}")
        if not user.is_staff:
            aggregation_methods = [
                method
                for method in aggregation_methods
                if method != AggregationMethod.SINGLE_AGGREGATION
            ]
    else:
        aggregation_methods = [
            AggregationMethod.RECENCY_WEIGHTED,
            AggregationMethod.UNWEIGHTED,
            AggregationMethod.METACULUS_PREDICTION,
        ]
        if user.is_staff:
            aggregation_methods.append(AggregationMethod.SINGLE_AGGREGATION)

    # get user_ids
    user_ids = request.GET.get("user_ids", None)
    if user_ids:
        user_ids = user_ids.split(",")
    if user_ids and not user.is_staff:
        # if user_ids provided, check user is staff
        raise PermissionDenied("Current user can not view user-specific data")
    include_bots = request.GET.get("include_bots", None)

    now = timezone.now()
    aggregation_dict: dict[Question, dict[str, AggregateForecast]] = defaultdict(dict)
    for question in questions:
        if (
            question.cp_reveal_time
            and question.cp_reveal_time > now
            and (not user or not user.is_superuser)
        ):
            continue

        aggregation_dict[question] = get_aggregation_history(
            question,
            aggregation_methods,
            user_ids=user_ids,
            minimize=True,
            include_stats=True,
            include_bots=(
                include_bots
                if include_bots is not None
                else question.include_bots_in_aggregates
            ),
            histogram=True,
        )

    csv_data = build_csv(aggregation_dict)
    filename = "_".join(post.title.split(" "))
    response = HttpResponse(
        csv_data,
        content_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}.csv"},
    )
    return response
