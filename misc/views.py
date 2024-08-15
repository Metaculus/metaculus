from django.conf import settings
from django.core.mail import EmailMessage
from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from notifications.models import Notification
from notifications.services import (
    NotificationPostMilestone, NotificationPostCPChange,
)
from .models import ITNArticle
from .serializers import ContactSerializer
from .services.itn import remove_article


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
def remove_article_api_view(request, pk):
    """
    Boots/Bury post
    """

    article = get_object_or_404(ITNArticle, pk=pk)

    if not request.user.is_superuser or not request.user.is_staff:
        raise PermissionDenied("You do not have permission to perform this action")

    remove_article(article)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([AllowAny])
def post_notifications_check(request):
    from users.models import User

    user = User.objects.get(pk=104161)

    context = NotificationPostCPChange.get_email_context_group(
        [
            Notification(
                recipient=user,
                params={
                    "post": {
                        "post_id": 349,
                        "post_title": "Will SpaceX land people on Mars before 2030?",
                    },
                    "question_data": [
                        {
                            "question": {
                                "id": 10630,
                                "title": "Who will be elected US President in 2024? (Joe Biden)",
                                "type": "binary"
                            },
                        }
                    ],
                },
            ),
        ]
    )

    template_name = "emails/post_status_change.html"

    return render(request, template_name, context_post_status_change)
