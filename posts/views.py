from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from misc.services.itn import get_post_similar_articles
from posts.models import (
    Post,
    Vote,
    PostUserSnapshot,
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
    reject_post,
    post_make_draft,
    send_back_to_review,
    trigger_update_post_translations,
    make_repost,
    vote_post,
)
from posts.services.feed import get_posts_feed, get_similar_posts
from posts.services.hotness import handle_post_boost, compute_hotness_total_boosts
from posts.services.spam_detection import check_and_handle_post_spam
from posts.services.subscriptions import create_subscription
from posts.utils import check_can_edit_post, get_post_slug
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services.common import get_project_permission_for_user
from questions.serializers.common import QuestionApproveSerializer
from utils.csv_utils import export_data_for_questions
from utils.files import validate_and_upload_image
from utils.paginator import CountlessLimitOffsetPagination, LimitOffsetPagination
from utils.tasks import email_data_task
from utils.views import validate_data_request

spam_error = ValidationError(
    detail="This post seems to be spam. Please contact "
    "support@metaculus.com if you believe this was a mistake.",
    code="SPAM_DETECTED",
)


@api_view(["GET"])
@permission_classes([AllowAny])
def posts_list_api_view(request):
    paginator = CountlessLimitOffsetPagination()
    qs = Post.objects.all()

    # Extra params
    with_cp = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("with_cp")
    )
    include_descriptions = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("include_descriptions", True)
    )
    include_cp_history = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("include_cp_history")
    )
    include_movements = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("include_movements")
    )
    include_conditional_cps = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("include_conditional_cps")
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
        with_key_factors=True,
        include_descriptions=include_descriptions,
        include_cp_history=include_cp_history,
        include_movements=include_movements,
        include_conditional_cps=include_conditional_cps,
        include_average_scores=True,
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

    return Response(
        serialize_post_many(qs, with_cp=True, include_cp_history=True, group_cutoff=3)
    )


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
        include_descriptions=True,
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
        with_key_factors=True,
        include_descriptions=True,
        include_cp_history=True,
        include_movements=True,
        include_average_scores=True,
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

    user_permission = get_post_permission_for_user(post, user=request.user)
    is_user_admin = user_permission == ObjectPermission.ADMIN

    should_delete = not is_user_admin and check_and_handle_post_spam(request.user, post)

    if should_delete:
        post.curation_status = Post.CurationStatus.DELETED
        post.save(update_fields=["curation_status"])
        raise spam_error

    return Response(
        serialize_post(post, current_user=request.user),
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

    post = update_post(post, updated_by=request.user, **serializer.validated_data)

    should_delete = check_and_handle_post_spam(request.user, post)

    if should_delete:
        post.curation_status = Post.CurationStatus.DELETED
        post.save(update_fields=["curation_status"])
        raise spam_error

    trigger_update_post_translations(post, with_comments=False, force=False)

    return Response(
        serialize_post(post, current_user=request.user),
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def post_approve_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_approve_or_reject(permission, raise_exception=True)

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
def post_reject_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_approve_or_reject(permission, raise_exception=True)

    reject_post(post)

    return Response(status=status.HTTP_200_OK)


@api_view(["POST"])
def post_make_draft_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_submit_for_review(permission, raise_exception=True)

    post_make_draft(post)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def post_send_back_to_review_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)

    check_can_edit_post(post, request.user)
    send_back_to_review(post)

    return Response(status=status.HTTP_200_OK)


@api_view(["DELETE"])
def post_delete_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_delete(permission, raise_exception=True)

    post.update_curation_status(Post.CurationStatus.DELETED)
    post.save(update_fields=["curation_status"])

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def post_vote_api_view(request: Request, pk: int):
    post = get_object_or_404(Post, pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    direction = serializers.ChoiceField(
        required=False, allow_null=True, choices=Vote.VoteDirection.choices
    ).run_validation(request.data.get("direction"))

    vote_score = vote_post(post, request.user, direction)

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

    file_url = validate_and_upload_image(image)

    return Response({"url": file_url})


@api_view(["POST"])
def activity_boost_api_view(request, pk):
    """
    Boots/Bury post
    """

    post = get_object_or_404(Post, pk=pk)
    direction = serializers.ChoiceField(
        choices=Vote.VoteDirection.choices
    ).run_validation(request.data.get("direction"))

    if not request.user.is_superuser:
        raise PermissionDenied("You do not have permission boost this post")

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    boost = handle_post_boost(request.user, post, direction)

    return Response(
        {"score": boost.score, "score_total": compute_hotness_total_boosts(post)},
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
    post_articles = get_post_similar_articles(post)

    return Response(
        [
            {
                **PostRelatedArticleSerializer(post_article.article).data,
                "distance": post_article.distance,
            }
            for post_article in post_articles
        ]
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def email_data(request: Request, post_id: int):
    validated_task_params = validate_data_request(request, post_id=post_id)
    email_data_task.send(**validated_task_params)
    return Response({"message": "Email scheduled to be sent"}, status=200)


@api_view(["GET"])
@permission_classes([AllowAny])
def download_data(request, post_id: int):
    validated_data_params = validate_data_request(request, post_id=post_id)
    data = export_data_for_questions(**validated_data_params)

    filename = validated_data_params.get("filename", "data.zip")
    response = HttpResponse(
        data,
        content_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}.zip"},
    )
    return response


@api_view(["GET"])
@permission_classes([AllowAny])
def random_post_id(request):
    post = (
        Post.objects.filter_permission(user=request.user)
        .filter_public()
        .filter_questions()
        .filter_active()
        .order_by("?")
        .first()
    )
    return Response({"id": post.id, "post_slug": get_post_slug(post)})


@api_view(["POST"])
def repost_api_view(request, pk):
    """
    Boots/Bury post
    """

    user = request.user
    post = get_object_or_404(Post, pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(post, user=user)
    ObjectPermission.can_view(permission, raise_exception=True)

    project_id = serializers.IntegerField().run_validation(
        request.data.get("project_id")
    )

    # Allow reposting only into projects where the user has Admin or Curator permissions
    project = get_object_or_404(Project, pk=project_id)

    # Check permissions
    permission = get_project_permission_for_user(project, user=request.user)
    ObjectPermission.can_repost_into_project(permission, raise_exception=True)

    make_repost(post, project)

    return Response(status=status.HTTP_204_NO_CONTENT)
