import django
from django.conf import settings
from django.core.mail import EmailMessage
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from .models import Bulletin, BulletinViewedBy, ITNArticle
from .serializers import ContactSerializer
from .services.itn import remove_article


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response(status=status.HTTP_200_OK)


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
    Removes article from everywhere
    """

    article = get_object_or_404(ITNArticle, pk=pk)

    if not request.user.is_superuser or not request.user.is_staff:
        raise PermissionDenied("You do not have permission to perform this action")

    remove_article(article)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_bulletins(request):
    user = request.user

    bulletins = Bulletin.objects.filter(
        bulletin_start__lte=django.utils.timezone.now(),
        bulletin_end__gte=django.utils.timezone.now(),
    )

    bulletins_viewed_by_user = []
    if user and user.is_authenticated:
        bulletins_viewed_by_user = [
            x.bulletin.pk for x in BulletinViewedBy.objects.filter(user=user).all()
        ]

    bulletins = [x for x in bulletins if x.pk not in bulletins_viewed_by_user]
    bulletins_ser = {
        "bulletins": [
            {"text": bulletin.text, "id": bulletin.pk} for bulletin in bulletins
        ]
    }
    return Response(bulletins_ser)


@api_view(["POST"])
@permission_classes([AllowAny])
def cancel_bulletin(request, pk):
    user = request.user
    if not user or not user.is_authenticated:
        return Response(status=status.HTTP_200_OK)
    bulletin_viewed_by = BulletinViewedBy(
        bulletin=Bulletin.objects.get(pk=pk), user=user
    )
    bulletin_viewed_by.save()
    return Response(status=status.HTTP_201_CREATED)
