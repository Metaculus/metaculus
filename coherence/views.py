from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from coherence.models import CoherenceLink
from coherence.serializers import CoherenceLinkSerializer, serialize_coherence_link
from coherence.services import create_coherence_link
from questions.models import Question


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_link_api_view(request):
    serializer = CoherenceLinkSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = serializer.validated_data
    coherence_link = create_coherence_link(**data, user=request.user)
    response_serializer = serialize_coherence_link(coherence_link)
    return Response(response_serializer, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_links_for_question_api_view(request, pk):
    question = get_object_or_404(Question, pk=pk)
    links = CoherenceLink.objects.filter(
        Q(question1=question) | Q(question2=question), user=request.user
    )

    links_to_data = []
    for link in links:
        links_to_data.append(serialize_coherence_link(link))

    return Response({"size": len(links_to_data), "data": links_to_data})


@api_view(["DELETE"])
def delete_link_api_view(request, pk):
    link = get_object_or_404(CoherenceLink, pk=pk)

    if request.user.id != link.user_id:
        raise PermissionDenied(
            "You don't have permission to delete this coherence link"
        )

    link.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
