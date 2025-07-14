from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from coherence.serializers import CoherenceLinkSerializer


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_link_api_view(request):
    serializer = CoherenceLinkSerializer(data=request.data)

    if serializer.is_valid():
        coherence_link = serializer.save(user=request.user)
        response_serializer = CoherenceLinkSerializer(coherence_link)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_links_for_question(request, pk):
    return Response({"content": "temp"})