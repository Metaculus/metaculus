from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


# Create your views here.
@api_view(["POST"])
@permission_classes([AllowAny])
def create_link_api_view(request):
    return Response({"content" : "Hello world"})