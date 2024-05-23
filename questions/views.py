from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status, filters
from rest_framework.decorators import api_view
from questions.models import Question
from questions.serializers import QuestionSerializer


@api_view(["POST"])
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

    serializer = QuestionSerializer(questions, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def question_detail(request: Request, pk):
    question = get_object_or_404(Question, pk=pk)
    serializer = QuestionSerializer(question)
    return Response(serializer.data)


@api_view(["POST"])
def create_question(request):
    serializer = QuestionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
def update_question(request, pk):
    question = get_object_or_404(Question, pk=pk)
    if request.user != question.author:
        return Response(status=status.HTTP_403_FORBIDDEN)

    serializer = QuestionSerializer(question, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
def delete_question(request, pk):
    question = get_object_or_404(Question, pk=pk)
    if request.user != question.author:
        return Response(status=status.HTTP_403_FORBIDDEN)
    question.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
