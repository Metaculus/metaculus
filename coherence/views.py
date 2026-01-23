from django.db.models import Q, Exists, OuterRef
from django.shortcuts import get_object_or_404
from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response

from coherence.models import (
    CoherenceLink,
    AggregateCoherenceLink,
    AggregateCoherenceLinkVote,
)
from coherence.serializers import (
    CoherenceLinkSerializer,
    serialize_coherence_link,
    serialize_coherence_link_many,
    serialize_aggregate_coherence_link_many,
    NeedsUpdateQuerySerializer,
    serialize_aggregate_coherence_link_vote,
)
from coherence.services import (
    create_coherence_link,
    aggregate_coherence_link_vote,
)
from coherence.utils import get_aggregation_results, get_aggregations_links
from posts.services.common import get_post_permission_for_user
from projects.models import Project
from projects.permissions import ObjectPermission
from questions.models import Question, Forecast
from questions.services.forecasts import create_forecast_bulk
from questions.serializers.common import (
    serialize_question,
    ForecastWriteSerializer,
    MyForecastSerializer,
)
from scoring.models import Leaderboard
from users.models import User


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_link_api_view(request):
    serializer = CoherenceLinkSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    question1_id = data["question1_id"]
    question1 = Question.objects.get(id=question1_id)
    question1_permission = get_post_permission_for_user(
        question1.post, user=request.user
    )
    ObjectPermission.can_view(question1_permission, raise_exception=True)

    question2_id = data["question2_id"]
    question2 = Question.objects.get(id=question2_id)
    question2_permission = get_post_permission_for_user(
        question2.post, user=request.user
    )
    ObjectPermission.can_view(question2_permission, raise_exception=True)
    coherence_link = create_coherence_link(
        user=request.user,
        question1=question1,
        question2=question2,
        direction=data["direction"],
        strength=data["strength"],
        link_type=data["type"],
    )
    response_serializer = serialize_coherence_link(coherence_link)
    return Response(response_serializer, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_links_for_question_api_view(request, pk):
    question = get_object_or_404(Question, pk=pk)
    links = CoherenceLink.objects.filter(
        Q(question1=question) | Q(question2=question), user=request.user
    )

    links_to_data = serialize_coherence_link_many(links)

    return Response({"data": links_to_data})


@api_view(["GET"])
@permission_classes([AllowAny])
def get_aggregate_links_for_question_api_view(request: Request, pk: int):
    question = get_object_or_404(Question, pk=pk)
    links = AggregateCoherenceLink.objects.filter(
        Q(question1=question) | Q(question2=question)
    )

    links_to_data = serialize_aggregate_coherence_link_many(
        links,
        current_user=request.user if request.user.is_authenticated else None,
        current_question=question,
    )

    return Response({"data": links_to_data})


@api_view(["POST"])
def aggregate_links_vote_view(request: Request, pk: int):
    aggregation = get_object_or_404(AggregateCoherenceLink, pk=pk)

    vote = serializers.ChoiceField(
        required=False,
        allow_null=True,
        choices=AggregateCoherenceLinkVote.VoteDirection.choices,
    ).run_validation(request.data.get("vote"))

    aggregate_coherence_link_vote(aggregation, user=request.user, vote=vote)

    # Calculate strength
    _, strength, _ = get_aggregation_results(
        get_aggregations_links([aggregation]), list(aggregation.votes.all())
    )

    return Response(
        {
            **serialize_aggregate_coherence_link_vote(
                list(aggregation.votes.all()), user_vote=vote
            ),
            "strength": strength,
        }
    )


@api_view(["DELETE"])
def delete_link_api_view(request, pk):
    link = get_object_or_404(CoherenceLink, pk=pk)

    if request.user.id != link.user_id:
        raise PermissionDenied(
            "You don't have permission to delete this coherence link"
        )

    link.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def get_links_for_questions(request):
    user = request.user
    if not user.is_authenticated:
        raise PermissionDenied(
            "Authentication is required to get questions requiring update."
        )

    serializer = NeedsUpdateQuerySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    question_ids = serializer.validated_data["question_ids"]
    # datetime = serializer.validated_data["datetime"]
    retrieve_all_data = serializer.validated_data.get("retrieve_all_data", False)

    if retrieve_all_data:
        if not (user.is_staff or user.is_superuser):
            raise PermissionDenied("Non-admin user can't request to retrieve all data")
        links_user = None
    else:
        links_user = user

    links = CoherenceLink.objects.filter(
        Q(question1_id__in=question_ids) | Q(question2_id__in=question_ids)
    ).distinct("id")
    if links_user is not None:
        links = links.filter(user=links_user)
    questions = Question.objects.filter(id__in=question_ids)

    serialized_links = CoherenceLinkSerializer(links, many=True).data
    serialized_questions = [
        serialize_question(q) for q in Question.objects.filter(id__in=question_ids)
    ]
    # annotate all coherence bots' 2 most recent forecasts
    coherence_bots = User.objects.filter(metadata__has_key="coherence_bot_for_user_id")
    # coherence_bots = User.objects.filter()
    coherence_bot_forecasts = Forecast.objects.filter(
        author__in=coherence_bots, question__in=questions
    ).order_by("-start_time")
    coherence_bot_forecasts_by_question_by_bot = dict()
    for forecast in coherence_bot_forecasts:
        question_id = forecast.question_id
        if question_id not in coherence_bot_forecasts_by_question_by_bot:
            coherence_bot_forecasts_by_question_by_bot[question_id] = dict()
        question_data = coherence_bot_forecasts_by_question_by_bot[question_id]
        bot = forecast.author
        coherence_user_id = bot.metadata["coherence_bot_for_user_id"]
        if coherence_user_id not in question_data:
            question_data[coherence_user_id] = {
                "latest": None,
                "second_latest": None,
            }
        if question_data[coherence_user_id]["latest"] is None:
            question_data[coherence_user_id]["latest"] = MyForecastSerializer(
                forecast
            ).data
        elif question_data[coherence_user_id]["second_latest"] is None:
            question_data[coherence_user_id]["second_latest"] = MyForecastSerializer(
                forecast
            ).data
    return Response(
        {
            "links": serialized_links,
            "questions": serialized_questions,
            "coherence_bot_forecasts": coherence_bot_forecasts_by_question_by_bot,
        }
    )


class CoherenceBotForecastSerializer(ForecastWriteSerializer):
    forecaster_id = serializers.IntegerField()

    class Meta(ForecastWriteSerializer.Meta):
        fields = ForecastWriteSerializer.Meta.fields + ("forecaster_id",)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def post_coherence_bot_forecast(request):
    """
    Posts a forecast as a Coherence Bot for a given user
    """
    serializer = CoherenceBotForecastSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    forecast = serializer.validated_data

    forecaster_id = forecast.pop("forecaster_id")
    question: Question = Question.objects.get(id=forecast["question"])
    forecast["question"] = question  # used in create_foreacst_bulk

    # get coherence bot for user
    user = User.objects.get(id=forecaster_id)
    coherence_bot = User.objects.filter(
        metadata={"coherence_bot_for_user_id": user.id}
    ).first()
    bot_created = False
    if not coherence_bot:
        bot_created = True
        coherence_bot = User.objects.create(
            username=f"{user.username}-coherence-bot",
            is_bot=True,
            check_for_spam=False,
            bot_owner=request.user,
            metadata={"coherence_bot_for_user_id": user.id},
        )

    create_forecast_bulk(user=coherence_bot, forecasts=[forecast])

    if bot_created:
        # add coherence_bot to coherence Leaderboard
        project: Project = question.post.default_project
        coherence_leaderboard, _ = Leaderboard.objects.get_or_create(
            project=project,
            name="Coherence Leaderboard",
            score_type="peer_tournament",
            bot_status=Project.BotLeaderboardStatus.BOTS_ONLY,
        )
        coherence_leaderboard.user_list.add(coherence_bot)
        coherence_leaderboard.user_list.add(request.user)

    return Response({"status": "success"}, status=200)
