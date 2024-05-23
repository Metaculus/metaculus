from django.test import TestCase, Client
from django.urls import reverse
from rest_framework import status
from questions.models import Question
from users.models import User


class QuestionEndpointsTestCase(TestCase):
    def setUp(self):
        self.client = Client()

    def test_question_list(self):
        url = "/questions/list/"
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_question_detail(self):
        url = f"/questions/{Question.objects.first().pk}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, dict)

    def test_create_question(self):
        self.client.force_login(User.objects.first())
        url = "/questions/create/"
        data = {
            "title": "New Question",
            "description": "This is a new question",
            "type": "binary",
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsInstance(response.data, dict)

    def test_update_question(self):
        self.client.force_login(User.objects.first())
        url = f"/questions/{Question.objects.first().pk}/update/"
        data = {
            "title": "Updated Question",
            "description": "This is an updated question",
            "type": "binary",
        }
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, dict)

    def test_delete_question(self):
        self.client.force_login(User.objects.first())
        url = f"/questions/{Question.objects.first().pk}/delete/"
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
