from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["POST"])
def create_link_api_view(request):
    return Response({"content" : request.data})