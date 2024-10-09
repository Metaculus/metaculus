from django.urls import path

from . import views

urlpatterns = [
    path(
        "anthropic/v1/messages/",
        views.anthropic_v1_messages,
        name="anthropic_v1_messages",
    ),
    path(
        "openai/v1/chat/completions/",
        views.openai_v1_chat_completions,
        name="anthropic_v1_messages",
    ),
]
