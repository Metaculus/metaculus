from rest_framework.test import APIClient
from social_core.backends.google import GoogleOAuth2

from authentication.services.common import get_tokens_for_user
from tests.unit.test_users.factories import factory_user


def test_bearer_header_is_not_passed_to_the_pipeline(mocker):
    signed_in = factory_user(is_active=True)
    provider_user = factory_user(is_active=True)
    complete = mocker.patch.object(GoogleOAuth2, "complete", return_value=provider_user)

    client = APIClient()
    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {get_tokens_for_user(signed_in)['access']}"
    )
    response = client.post(
        "/api/auth/social/google-oauth2/",
        {
            "code": "code",
            "redirect_uri": "http://localhost:3000/accounts/social/google-oauth2",
        },
        format="json",
    )

    assert response.status_code == 200
    assert complete.call_args.kwargs["user"] is None
