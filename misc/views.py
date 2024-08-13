from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from .serializers import ContactSerializer
from .tasks import send_email_async


@api_view(["POST"])
@permission_classes([AllowAny])
def contact_api_view(request: Request):
    serializer = ContactSerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)

    send_email_async.send(
        subject=serializer.data["subject"] or "Contact Form",
        message=serializer.data["message"],
        from_email=settings.EMAIL_SENDER_NO_REPLY,
        recipient_list=[settings.EMAIL_FEEDBACK],
    )

    return Response(status=status.HTTP_201_CREATED)
