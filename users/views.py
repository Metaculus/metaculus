from rest_framework.decorators import api_view
from rest_framework.response import Response

from users.serializers import UserPrivateSerializer


@api_view(["GET"])
def current_user_api_view(request):
    return Response(UserPrivateSerializer(request.user).data)
