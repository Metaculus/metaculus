from rest_framework import status
from rest_framework.exceptions import APIException


class ForecastUnavailableError(APIException):
    """
    A question is not currently open for forecasting. Rendered by DRF as the
    endpoint's historical 405 {"error": ...} response without a try/except.
    """

    status_code = status.HTTP_405_METHOD_NOT_ALLOWED

    def __init__(self, message: str):
        super().__init__(detail={"error": message})
