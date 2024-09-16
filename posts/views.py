import requests
import logging

from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from utils.frontend import build_question_embed_url

from misc.services.itn import get_post_get_similar_articles
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
)
from posts.services.feed import get_posts_feed, get_similar_posts
from posts.services.subscriptions import create_subscription
from posts.utils import check_can_edit_post
from projects.permissions import ObjectPermission
from questions.serializers import (
    QuestionApproveSerializer,
)
from utils.files import UserUploadedImage, generate_filename


@api_view(["GET"])
@permission_classes([AllowAny])
def posts_list_api_view(request):
    paginator = LimitOffsetPagination()
    qs = Post.objects.all()

    # Extra params
    with_cp = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("with_cp")
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
    )

    return paginator.get_paginated_response(data)


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
    status = filters_serializer.validated_data.get("status", None)
    projects = filters_serializer.validated_data.get("project", None)
    order_by = filters_serializer.validated_data.get("order_by", None)

    qs = get_posts_feed(
        qs,
        user=request.user,
        tournaments=projects,
        statuses=status,
        order_by=order_by,
        forecast_type=["binary"],
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
        with_nr_forecasters=True,
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
    qs = get_posts_feed(qs=Post.objects.all(), ids=[pk], user=request.user)
    posts = serialize_post_many(
        qs,
        current_user=request.user,
        with_cp=True,
        with_subscriptions=True,
        with_nr_forecasters=True,
    )

    if not posts:
        raise NotFound("Post not found")

    return Response(posts[0])


@api_view(["POST"])
def post_create_api_view(request):
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

    serializer = PostUpdateSerializer(
        post, data=request.data, partial=True, context={"user": request.user}
    )
    serializer.is_valid(raise_exception=True)

    post = update_post(post, **serializer.validated_data)

    return Response(
        serialize_post(post, with_cp=False, current_user=request.user),
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def post_approve_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_approve(permission, raise_exception=True)

    serializer = QuestionApproveSerializer(post, data=request.data, many=True)
    serializer.is_valid(raise_exception=True)

    approve_post(post, questions=serializer.validated_data)

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

    return Response(
        {"score": Post.objects.annotate_vote_score().get(pk=post.pk).vote_score}
    )


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
    keep_types = set()

    for data in serializers.ListField().run_validation(request.data):
        subscription_type = data.get("type")

        serializer = get_subscription_serializer_by_type(subscription_type)(data=data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Check changed
        # Check whether subscription was changed
        existing_subscription = next(
            (sub for sub in existing_subscriptions if sub.type == subscription_type),
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
            keep_types.add(subscription_type)

    # Deleting subscriptions
    existing_subscriptions.exclude(type__in=keep_types).delete()

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
        ).distinct(),
        with_cp=False,
        current_user=request.user,
        with_subscriptions=True,
    )

    return Response(posts)


@api_view(["GET"])
@permission_classes([AllowAny])
def post_similar_posts_api_view(request: Request, pk):
    post = get_object_or_404(Post, pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    # Retrieve cached articles
    posts = get_similar_posts(post)

    return Response(serialize_post_many(posts, with_cp=True, current_user=request.user))


@api_view(["GET"])
@permission_classes([AllowAny])
def post_related_articles_api_view(request: Request, pk):
    post = get_object_or_404(Post, pk=pk)

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    # Retrieve cached articles
    articles = get_post_get_similar_articles(post)

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
