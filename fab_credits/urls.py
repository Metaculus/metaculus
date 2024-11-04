from django.urls import re_path

from . import views

urlpatterns = [
    re_path(
        # Optional trailing slash
        r"^anthropic/v1/messages/?$",
        views.anthropic_v1_messages,
        name="anthropic_v1_messages",
    ),
    re_path(
        # Optional trailing slash
        r"^openai/v1/chat/completions/?$",
        views.openai_v1_chat_completions,
        name="openai_v1_chat_completions",
    ),
]
