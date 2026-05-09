from datetime import datetime

from django.conf import settings
from django.core.mail import EmailMessage
from django.http import JsonResponse
from django.views.decorators.cache import cache_page
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from questions.constants import UnsuccessfulResolutionType
from questions.models import Question, Forecast
from .models import Bulletin, BulletinViewedBy, ITNArticle, SidebarItem
from .serializers import (
    ContactSerializer,
    ContactServicesSerializer,
    SidebarItemSerializer,
)
from .services.itn import remove_article
from .utils import get_data_access_status


@api_view(["POST"])
@permission_classes([AllowAny])
def contact_api_view(request: Request):
    serializer = ContactSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    EmailMessage(
        subject=serializer.data["subject"] or "Contact Form",
        body=serializer.data["message"],
        from_email=settings.EMAIL_SENDER_NO_REPLY,
        to=[settings.EMAIL_FEEDBACK],
        reply_to=[serializer.data["email"]],
    ).send()

    return Response(status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def contact_service_api_view(request: Request):
    serializer = ContactServicesSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    EmailMessage(
        subject="New form submission via Services page",
        body=(
            f"Your name: {serializer.data.get('name')}\n"
            f"Email address: {serializer.data['email']}\n"
            f"Organization: {serializer.data.get('organization')}\n"
            f"Interested in: {serializer.data.get('service')}\n"
            f"Message: {serializer.data.get('message')}\n"
        ),
        from_email=settings.EMAIL_SENDER_NO_REPLY,
        to=[settings.EMAIL_SUPPORT],
        reply_to=[serializer.data["email"]],
    ).send()

    return Response(status=status.HTTP_201_CREATED)


@api_view(["POST"])
def remove_article_api_view(request, pk):
    """
    Removes article from everywhere
    """

    article = get_object_or_404(ITNArticle, pk=pk)

    if not request.user.is_superuser or not request.user.is_staff:
        raise PermissionDenied("You do not have permission to perform this action")

    remove_article(article)

    return Response(status=status.HTTP_204_NO_CONTENT)


@cache_page(60)
@api_view(["GET"])
@permission_classes([AllowAny])
def get_bulletins(request):
    bulletins = Bulletin.objects.filter(
        bulletin_start__lte=timezone.now(),
        bulletin_end__gte=timezone.now(),
    ).order_by("-bulletin_start", "-created_at", "-pk")

    bulletins_ser = {
        "bulletins": [
            {"text": bulletin.text, "id": bulletin.pk} for bulletin in bulletins
        ]
    }
    return Response(bulletins_ser)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_dismissed_bulletin_ids(request):
    user = request.user
    if not user or not user.is_authenticated:
        return Response({"dismissed_bulletin_ids": []})

    dismissed_bulletin_ids = list(
        BulletinViewedBy.objects.filter(
            user=user,
            bulletin__bulletin_start__lte=timezone.now(),
            bulletin__bulletin_end__gte=timezone.now(),
        ).values_list("bulletin_id", flat=True)
    )
    return Response({"dismissed_bulletin_ids": dismissed_bulletin_ids})


@cache_page(60 * 60 * 24)
@api_view(["GET"])
@permission_classes([AllowAny])
def get_site_stats(request):
    now_year = datetime.now().year
    public_questions = Question.objects.filter_public()
    stats = {
        "predictions": Forecast.objects.filter(question__in=public_questions)
        .exclude(source=Forecast.SourceChoices.AUTOMATIC)
        .count(),
        "questions": public_questions.count(),
        "resolved_questions": public_questions.filter(actual_resolve_time__isnull=False)
        .exclude(resolution__in=UnsuccessfulResolutionType)
        .count(),
        "years_of_predictions": now_year - 2015 + 1,
    }
    return JsonResponse(stats)


@api_view(["POST"])
@permission_classes([AllowAny])
def cancel_bulletin(request, pk):
    user = request.user
    if not user or not user.is_authenticated:
        return Response(status=status.HTTP_200_OK)
    BulletinViewedBy.objects.get_or_create(
        bulletin=Bulletin.objects.get(pk=pk), user=user
    )
    return Response(status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([AllowAny])
def sidebar_api_view(request: Request):
    sidebar_items = SidebarItem.objects.select_related(
        "post__default_project", "project"
    )

    return Response(SidebarItemSerializer(sidebar_items, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_data_access_status_api_view(request: Request):
    data = request.query_params
    post_id = data.get("post_id")
    project_id = data.get("project_id")
    user = request.user if request.user.is_authenticated else None

    has_data_access, view_deanonymized_data = get_data_access_status(
        user, post_id, project_id
    )

    return Response(
        {
            "has_data_access": has_data_access,
            "view_deanonymized_data": view_deanonymized_data,
        },
        status=status.HTTP_200_OK,
    )
