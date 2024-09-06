from datetime import timedelta
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404, redirect
import django.utils
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

import os
import django
from PIL import Image
from io import BytesIO
import tempfile

from misc.services.itn import get_post_get_similar_articles
from posts.models import (
    Post,
    Vote,
    PostUserSnapshot,
    PostActivityBoost,
)
from posts.serializers import (
    NotebookSerializer,
    PostFilterSerializer,
    OldQuestionFilterSerializer,
    PostSerializer,
    PostWriteSerializer,
    serialize_post_many,
    serialize_post,
    get_subscription_serializer_by_type,
    PostRelatedArticleSerializer,
)
from posts.services.common import (
    create_post,
    get_post_permission_for_user,
    add_categories,
)
from posts.services.feed import get_posts_feed
from posts.services.subscriptions import create_subscription
from projects.models import Project
from projects.permissions import ObjectPermission
from questions.models import Question
from questions.serializers import (
    GroupOfQuestionsSerializer,
    QuestionSerializer,
    QuestionWriteSerializer,
)
from questions.services import clone_question, create_question
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
    if not request.data.get("url_title", None):
        request.data["url_title"] = request.data["title"]

    serializer = PostWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    post = create_post(**serializer.validated_data, author=request.user)
    if "categories" in request.data:
        add_categories(request.data["categories"], post)
    if request.data.get("news_type", None):
        news_project = (
            Project.objects.filter(type=Project.ProjectTypes.NEWS_CATEGORY)
            .filter(name__iexact=request.data["news_type"])
            .first()
        )
        post.projects.add(news_project)
        post.save()

    return Response(
        serialize_post(post, with_cp=False, current_user=request.user),
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def remove_from_project(request, pk):
    post = get_object_or_404(Post, pk=pk)
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_edit(permission, raise_exception=True)

    project_id = request.data["project_id"]
    post.projects.set([x for x in post.projects.all() if x.id != project_id])
    post.save()
    return Response({}, status=status.HTTP_200_OK)


@api_view(["PUT"])
def post_update_api_view(request, pk):
    post = get_object_or_404(Post, pk=pk)
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_edit(permission, raise_exception=True)

    serializer = PostSerializer(post, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    question_data = request.data.get("question", None)
    conditional_data = request.data.get("conditional", None)
    group_of_questions_data = request.data.get("group_of_questions", None)
    notebook_data = request.data.get("notebook", None)

    if question_data:
        ser = QuestionSerializer(post.question, data=question_data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
    if conditional_data:
        condition = None
        condition_child = None
        if conditional_data["condition_id"] != post.conditional.condition_id:
            condition = Question.objects.get(pk=conditional_data["condition_id"])
        if (
            conditional_data["condition_child_id"]
            != post.conditional.condition_child_id
        ):
            condition_child = Question.objects.get(
                pk=conditional_data["condition_child_id"]
            )

        if condition_child or condition:
            if condition_child:
                post.conditional.condition_child = condition_child
            if condition:
                post.conditional.condition = condition
            q = clone_question(
                condition_child,
                title=f"{post.conditional.condition.title} (Yes) → {post.conditional.condition_child.title}",
            )
            q.save()
            post.conditional.question_yes = q
            q = clone_question(
                condition_child,
                title=f"{post.conditional.condition.title} (No) → {post.conditional.condition_child.title}",
            )
            q.save()
            post.conditional.question_no = q
        post.conditional.save()
    if group_of_questions_data:
        sub_questions = group_of_questions_data.get("questions", None)
        delete = group_of_questions_data.get("delete", None)
        if delete:
            for question_id in delete:
                question = Question.objects.get(
                    pk=question_id, group_id=post.group_of_questions.id
                )
                question.delete()
        if sub_questions:
            for sub_question_data in sub_questions:
                if sub_question_data.get("id", None):
                    sub_question = Question.objects.get(
                        pk=sub_question_data["id"], group_id=post.group_of_questions.id
                    )
                    sub_ser = QuestionSerializer(
                        sub_question,
                        data=sub_question_data,
                        partial=True,
                    )
                    sub_ser.is_valid(raise_exception=True)
                    sub_ser.save()
                else:
                    sub_ser = QuestionWriteSerializer(
                        data=sub_question_data,
                        partial=True,
                    )
                    sub_ser.is_valid(raise_exception=True)
                    create_question(group_id=post.group_of_questions.id, **sub_ser.data)

        ser = GroupOfQuestionsSerializer(
            post.group_of_questions, data=group_of_questions_data, partial=True
        )
        ser.is_valid(raise_exception=True)
        ser.save()
    if notebook_data:
        ser = NotebookSerializer(post.notebook, data=notebook_data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()

    post.update_pseudo_materialized_fields()
    if "categories" in request.data:
        add_categories(request.data["categories"], post)
    if "default_project_id" in request.data:
        post.default_project_id = request.data["default_project_id"]
    serializer.save()
    return Response(serializer.data)


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
    filename = f"preview-post-{pk}.png"

    if not post.preview_image_generated_at or post.preview_image_generated_at < (
        django.utils.timezone.now() - timedelta(hours=6)
    ):
        # This has to happen where because once we're in the playwright sync context the connection is invalidated
        post.preview_image_generated_at = django.utils.timezone.now()
        post.save()
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:

            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1200, "height": 630})

            origin = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

            url = f"{origin}/embed/questions/{pk}?ENFORCED_THEME_PARAM=dark&HIDE_ZOOM_PICKER=true&non-interactive=true"
            page.goto(url)
            page.wait_for_load_state("networkidle")

            element = page.query_selector("#id-used-by-screenshot-donot-change")

            if not element:
                browser.close()
                return Response("Element not found", status=404)

            screenshot = element.screenshot(type="png")
            image = Image.open(BytesIO(screenshot))
            temp_file = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
            image.save(temp_file, "PNG")
            default_storage.save(filename, temp_file, max_length=100)
            browser.close()

    file_url = default_storage.url(filename)
    return redirect(file_url)
    # Do this in case redirects end up not working:
    # response = requests.get(file_url)
    # return HttpResponse(response.content, content_type='image/png')  #
