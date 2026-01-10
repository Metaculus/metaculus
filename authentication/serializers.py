from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from projects.models import Project
from users.models import User
from users.serializers import validate_username


class SignupSerializer(serializers.ModelSerializer):
    add_to_project = serializers.IntegerField(required=False)
    campaign_key = serializers.CharField(required=False)
    campaign_data = serializers.JSONField(required=False)
    redirect_url = serializers.CharField(required=False)
    invite_token = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    newsletter_optin = serializers.BooleanField(required=False, allow_null=True)
    app_theme = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, max_length=32
    )
    language = serializers.CharField(
        required=False, allow_null=True, allow_blank=True, max_length=32
    )

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "add_to_project",
            "campaign_key",
            "campaign_data",
            "redirect_url",
            "invite_token",
            "newsletter_optin",
            "language",
            "app_theme",
        )
        extra_kwargs = {"email": {"required": True}}

    def validate_language(self, value: str):
        try:
            return serializers.ChoiceField(
                choices=settings.LANGUAGES, required=False, allow_null=True
            ).run_validation(value)
        except serializers.ValidationError:
            return

    def validate_app_theme(self, value: str):
        try:
            return serializers.ChoiceField(
                choices=User.AppTheme.choices, required=False, allow_null=True
            ).run_validation(value)
        except serializers.ValidationError:
            return

    def validate_add_to_project(self, value):
        try:
            return Project.objects.get(pk=value)

        except Project.DoesNotExist:
            raise serializers.ValidationError(
                "Project to add the user to doesn't exist"
            )

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("The email already exists")

        return value

    def validate_username(self, value):
        return validate_username(value)

    def validate_password(self, value):
        validate_password(password=value)

        return value


class ConfirmationTokenSerializer(serializers.Serializer):
    """
    Serializer for token confirmation of Signup/PasswordReset
    """

    user_id = serializers.IntegerField(required=True)
    token = serializers.CharField(required=True)


class LoginSerializer(serializers.Serializer):
    # username or email
    login = serializers.CharField()
    password = serializers.CharField()
