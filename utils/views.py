from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError, NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.request import Request

from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from misc.models import WhitelistUser
from posts.models import Post
from posts.services.common import get_post_permission_for_user
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.services.common import get_project_permission_for_user
from questions.models import Question
from questions.serializers.common import serialize_question
from users.models import User
from utils.csv_utils import export_data_for_questions
from utils.the_math.aggregations import get_aggregation_history
from utils.serializers import DataGetRequestSerializer, DataPostRequestSerializer
from utils.tasks import email_data_task


@api_view(["GET"])
@permission_classes([AllowAny])
def aggregation_explorer_api_view(request):
    user: User = request.user
    post: Post

    question_id = request.GET.get("question_id")
    if question_id:
        question: Question | None = Question.objects.filter(id=question_id).first()
        if question is None:
            raise ValidationError(f"Question with id {question_id} not found")
        post = question.get_post()
    else:
        post_id = request.GET.get("post_id")
        post = Post.objects.filter(id=post_id).first()
        if post is None:
            raise ValidationError(f"Post with id {post_id} not found")
        if post.question is None:
            raise ValidationError(
                f"Post with id {post_id} has no question, please submit a subquestion."
            )
        question = post.question

    # Check permissions
    permission = get_post_permission_for_user(post, user=request.user)
    ObjectPermission.can_view(permission, raise_exception=True)

    # Context for the serializer
    is_staff = user.is_authenticated and user.is_staff
    is_whitelisted = user.is_authenticated and (
        WhitelistUser.objects.filter(
            Q(post=post)
            | Q(project=post.default_project)
            | (Q(post__isnull=True) & Q(project__isnull=True)),
            user=user,
        ).exists()
    )
    serializer_context = {
        "user": user if user.is_authenticated else None,
        "is_staff": is_staff,
        "is_whitelisted": is_whitelisted,
    }

    serializer = DataGetRequestSerializer(
        data=request.query_params, context=serializer_context
    )
    serializer.is_valid(raise_exception=True)
    params = serializer.validated_data
    aggregation_methods = params.get("aggregation_methods")
    user_ids = params.get("user_ids")
    include_bots = params.get("include_bots")
    minimize = params.get("minimize", True)

    aggregations = get_aggregation_history(
        question,
        aggregation_methods=aggregation_methods,
        user_ids=user_ids,
        minimize=minimize,
        include_stats=True,
        include_bots=(
            include_bots
            if include_bots is not None
            else question.include_bots_in_aggregates
        ),
        histogram=True,
    )
    aggregate_forecasts = []
    for aggregation in aggregations.values():
        aggregate_forecasts.extend(aggregation)

    data: dict = serialize_question(
        question,
        post=question.get_post(),
        aggregate_forecasts=aggregate_forecasts,
        full_forecast_values=True,
    )
    return Response(data)


def validate_data_request(request: Request, **kwargs):
    if request.method == "GET":
        data = (request.GET or {}).copy()
        data.update(kwargs)
        SerializerClass = DataGetRequestSerializer
    else:
        data = (request.data or {}).copy()
        data.update(kwargs)
        SerializerClass = DataPostRequestSerializer

    user: User = request.user

    question: Question | None = None
    post: Post | None = None
    project: Project | None = None

    if question_id := data.get("question_id"):
        question = get_object_or_404(Question, id=question_id)
    elif sub_question := data.get("sub_question"):
        question = get_object_or_404(Question, id=sub_question)

    if post_id := data.get("post_id"):
        post = get_object_or_404(Post, id=post_id)
    elif question:
        post = question.get_post()
    else:
        post = None
    if post:
        # Check permissions
        permission = get_post_permission_for_user(post, user=user)
        ObjectPermission.can_view(permission, raise_exception=True)

    if project_id := data.get("project_id"):
        project = get_object_or_404(Project, id=project_id)
    elif post:
        project = post.default_project
    if project:
        # Check permissions
        permission = get_project_permission_for_user(project, user=user)
        ObjectPermission.can_view(permission, raise_exception=True)

    # Context for the serializer
    is_staff = user.is_authenticated and user.is_staff
    is_whitelisted = (
        user.is_authenticated
        and WhitelistUser.objects.filter(
            (
                (Q(post=post) if post else Q())
                | (Q(project=project) if project else Q())
            ),
            user=user,
        ).exists()
    )
    serializer_context = {
        "user": user if user.is_authenticated else None,
        "is_staff": is_staff,
        "is_whitelisted": is_whitelisted,
    }

    serializer = SerializerClass(data=data, context=serializer_context)
    serializer.is_valid(raise_exception=True)
    params = serializer.validated_data

    aggregation_methods = params.get("aggregation_methods")
    minimize = params.get("minimize")
    include_comments = params.get("include_comments", False)
    include_scores = params.get("include_scores", True)
    include_user_data = params.get("include_user_data", False)

    user_ids = params.get("user_ids")
    include_bots = params.get("include_bots")
    if is_staff:
        anonymized = params.get("anonymized", False)
    elif is_whitelisted:
        anonymized = True
    else:
        anonymized = False

    # get all questions
    questions = []
    if question:
        questions = [question]
    elif post:
        questions = list(post.get_questions())
    elif project:
        questions = list(
            Question.objects.filter(
                Q(related_posts__post__default_project=project)
                | Q(related_posts__post__projects=project)
            ).distinct()
        )
    if not questions:
        raise NotFound("No questions found")

    filename = "metaculus_data"
    if post:
        filename = post.short_title or post.title
    elif project:
        filename = project.slug or project.name
    for char in [" ", "-", "/", ":", ",", "."]:
        filename = filename.replace(char, "_")
    filename = filename.replace("?", "")
    filename += ".zip"

    return {
        "user_id": user.id if user.is_authenticated else None,
        "user_email": user.email if user.is_authenticated else None,
        "is_staff": is_staff,
        "is_whitelisted": is_whitelisted,
        "filename": filename,
        "question_ids": [q.id for q in questions],
        "aggregation_methods": aggregation_methods,
        "minimize": minimize,
        "include_scores": include_scores,
        "include_user_data": include_user_data,
        "include_comments": include_comments,
        "user_ids": user_ids,
        "include_bots": include_bots,
        "anonymized": anonymized,
    }


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def email_data_view(request: Request):
    validated_task_params = validate_data_request(request)
    email_data_task.send(**validated_task_params)
    return Response({"message": "Email scheduled to be sent"}, status=200)


@api_view(["GET"])
@permission_classes([AllowAny])
def download_data_view(request: Request):
    validated_data_params = validate_data_request(request)
    filename = validated_data_params.get("filename", "data")
    data = export_data_for_questions(**validated_data_params)
    response = HttpResponse(
        data,
        content_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
    return response
