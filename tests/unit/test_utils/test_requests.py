from unittest.mock import MagicMock

from authentication.auth import FallbackTokenAuthentication
from utils.requests import is_internal_request


def make_request(host: str, authenticator=None):
    request = MagicMock()
    request.get_host.return_value = host
    request.successful_authenticator = authenticator
    return request


class TestIsInternalRequest:
    def test_apikey_auth_is_always_external(self, settings):
        # Even on an internal-looking host, ApiKey auth short-circuits to external.
        settings.APP_DOMAIN = "metaculus.com"
        request = make_request("backend.internal", FallbackTokenAuthentication())
        assert is_internal_request(request) is False

    def test_host_matching_app_domain_is_external(self, settings):
        settings.APP_DOMAIN = "metaculus.com"
        request = make_request("metaculus.com")
        assert is_internal_request(request) is False

    def test_host_with_port_strips_port_before_comparing(self, settings):
        settings.APP_DOMAIN = "metaculus.com"
        request = make_request("metaculus.com:443")
        assert is_internal_request(request) is False

    def test_uppercase_host_still_matches_app_domain(self, settings):
        settings.APP_DOMAIN = "metaculus.com"
        request = make_request("Metaculus.com")
        assert is_internal_request(request) is False

    def test_non_public_host_is_internal(self, settings):
        settings.APP_DOMAIN = "metaculus.com"
        request = make_request("backend.internal:8000")
        assert is_internal_request(request) is True

    def test_unset_app_domain_treats_all_non_apikey_as_internal(self, settings):
        # In dev where APP_DOMAIN is unset, every host differs from None -> internal.
        settings.APP_DOMAIN = None
        request = make_request("localhost:8000")
        assert is_internal_request(request) is True
