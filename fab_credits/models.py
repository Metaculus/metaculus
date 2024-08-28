from django.db import models

from users.models import User

available_models = [
    ("gpt-4o", "gpt-4o"),
    ("gpt-4o-2024-05-13", "gpt-4o-2024-05-13"),
    ("gpt-3.5-turbo-0125", "gpt-3.5-turbo-0125"),
    ("gpt-3.5-turbo-instruct", "gpt-3.5-turbo-instruct"),
    ("claude-3-5-sonnet-20240620", "claude-3-5-sonnet-20240620"),
    ("claude-3-opus-20240229", "claude-3-opus-20240229"),
    ("claude-3-sonnet-20240229", "claude-3-sonnet-20240229"),
    ("claude-3-haiku-20240307", "claude-3-haiku-20240307"),
]


# Create your models here.
class UserUsage(models.Model):
    class UsagePlatform(models.TextChoices):
        OpenAI = "OPENAI"
        Anthropic = "ANTHROPIC"

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    input_tokens_used = models.IntegerField(
        default=0, help_text="Keeps track of input token used. Filled in automatically"
    )
    output_tokens_used = models.IntegerField(
        default=0, help_text="Keeps track of output token used. Filled in automatically"
    )
    total_allowed_tokens = models.IntegerField(
        default=0,
        help_text="Used by admins to set the total number of input&output tokens the user can use.",
    )
    platform = models.CharField(
        max_length=50, choices=UsagePlatform.choices, default=UsagePlatform.OpenAI
    )
    model_name = models.CharField(
        max_length=50, default="gpt-4o", choices=available_models
    )

    class Meta:
        unique_together = ("user", "platform", "model_name")

    def __str__(self):
        return f"{self.user.username}({self.user.email}) - {self.platform}/{self.model_name}"
