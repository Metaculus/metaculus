import logging

import requests
from django.conf import settings
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request

logger = logging.getLogger(__name__)


def validate_turnstile(token: str, ip: str):
    secret = settings.TURNSTILE_SECRET_KEY

    if not secret:
        logger.warning("Cloudflare turnstile secret is not provided")

        return True

    url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    response = requests.post(
        url,
        data={
            "secret": secret,
            "response": token,
            "remoteip": ip,
        },
    )

    data = response.json()

    if data.get("success"):
        return True

    logger.error(f"Can't verify turnstile token: {data.get('error-codes')}")

    raise ValidationError("Wrong captcha")


def validate_turnstile_from_request(request: Request):
    return validate_turnstile(
        request.headers.get("cf-turnstile-response"),
        request.headers.get("CF-Connecting-IP"),
    )
