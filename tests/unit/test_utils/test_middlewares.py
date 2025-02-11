from django.conf import settings

from tests.unit.fixtures import *  # noqa


class TestAuthenticationRequiredMiddleware:
    def test_anon(self, anon_client):
        settings.AUTHENTICATION_REQUIRED = True
        response = anon_client.get("/api/posts/")

        assert response.status_code == 404

    def test_user(self, user1_client):
        settings.AUTHENTICATION_REQUIRED = True
        response = user1_client.get("/api/posts/")

        assert response.status_code == 200
