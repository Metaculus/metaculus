from itertools import chain

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

    if serializer.is_valid():
        data = serializer.validated_data
        coherence_link = create_coherence_link(**data, user=request.user)
        response_serializer = serialize_coherence_link(coherence_link)
        return Response(response_serializer, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_links_for_question_api_view(request, pk):
    question = get_object_or_404(Question, pk=pk)
    links_as_q1 = question.coherence_links_as_q1.filter(user=request.user)
    links_as_q2 = question.coherence_links_as_q2.filter(user=request.user)

    links_to_data = []
    for link in chain(links_as_q1, links_as_q2):
        links_to_data.append(serialize_coherence_link(link))

    return Response({"size": len(links_to_data), "data": links_to_data})


@api_view(["DELETE"])
def delete_link_api_view(request, pk):
    link = get_object_or_404(CoherenceLink, pk=pk)

    if request.user.id != link.user.id:
        raise PermissionDenied(
            "You don't have permission to delete this coherence link"
        )

    # TODO: add a `deleted` status? is this necessary?
    link.delete()

    return Response(status=status.HTTP_204_NO_CONTENT)
