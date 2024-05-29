from urllib.parse import urlencode

from django.conf import settings


def build_frontend_url(path: str = None):
    base_url = settings.FRONTEND_BASE_URL.strip().rstrip("/")
    path = path.strip().lstrip("/") if path else ""

    return f"{base_url}/{path}"


def build_frontend_account_activation_url(user_id: int, token: str):
    return build_frontend_url(
        f"/account/activation?{urlencode({'user_id': user_id, 'token': token})}"
    )


def build_frontend_social_auth_redirect(provider: str):
    return build_frontend_url(f"/login/social/{provider}")
