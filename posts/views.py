from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from posts.models import Post, Vote, PostUserSnapshot, PostActivityBoost
from posts.serializers import (
    NotebookSerializer,
    PostFilterSerializer,
    PostSerializer,
    PostWriteSerializer,
    serialize_post_many,
    serialize_post,
)
from posts.services import (
    get_posts_feed,
    create_post,
    get_post_permission_for_user,
    add_categories,
)
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
    with_forecasts = serializers.BooleanField(allow_null=True).run_validation(
        request.query_params.get("with_forecasts")
    )

    # Apply filtering
    filters_serializer = PostFilterSerializer(data=request.query_params)
    filters_serializer.is_valid(raise_exception=True)

    qs = get_posts_feed(qs, user=request.user, **filters_serializer.validated_data)
    # Paginating queryset
    posts = paginator.paginate_queryset(qs, request)

    data = serialize_post_many(
        posts,
        with_forecasts=with_forecasts,
        current_user=request.user,
    )

    return paginator.get_paginated_response(data)


@api_view(["GET"])
@permission_classes([AllowAny])
def post_detail(request: Request, pk):
    qs = get_posts_feed(qs=Post.objects.all(), ids=[pk], user=request.user)
    posts = serialize_post_many(qs, current_user=request.user, with_forecasts=True)

    if not posts:
        raise NotFound("Post not found")

    return Response(posts[0])


@api_view(["POST"])
def post_create_api_view(request):
    serializer = PostWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    post = create_post(**serializer.validated_data, author=request.user)
    if "categories" in request.data:
        add_categories(request.data["categories"], post)

    return Response(
        serialize_post(post, with_forecasts=False, current_user=request.user),
        status=status.HTTP_201_CREATED,
    )


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
