from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from questions.models import Question
from questions.serializers import QuestionSerializer, QuestionWriteSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def question_list(request):
    questions = Question.objects.all()
    search_query = request.query_params.get("search", None)
    ordering = request.query_params.get("ordering", None)

    if search_query:
        questions = questions.filter(title__icontains=search_query) | questions.filter(
            author__username__icontains=search_query
        )

    if ordering:
        questions = questions.order_by(ordering)

    # Prefetching related objects
    questions = questions.prefetch_projects()

    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([AllowAny])
def question_detail(request: Request, pk):
    print(request, pk)
    question = get_object_or_404(Question, pk=pk)
    serializer = QuestionSerializer(question)
    return Response(serializer.data)


@api_view(["POST"])
def create_question(request):
    serializer = QuestionWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    question = serializer.save(author=request.user)
    return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)


@api_view(["PUT"])
def update_question(request, pk):
    question = get_object_or_404(Question, pk=pk)
    if request.user != question.author:
        return Response(status=status.HTTP_403_FORBIDDEN)

    serializer = QuestionSerializer(question, data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(serializer.data)


@api_view(["DELETE"])
def delete_question(request, pk):
    question = get_object_or_404(Question, pk=pk)
    if request.user != question.author:
        return Response(status=status.HTTP_403_FORBIDDEN)
    question.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
