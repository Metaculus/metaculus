from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from users.models import User
from users.serializers import validate_username
from projects.models import Project


class SignupSerializer(serializers.ModelSerializer):
    add_to_project = serializers.IntegerField(required=False)
    campaign_key = serializers.CharField(required=False)
    campaign_data = serializers.JSONField(required=False)
    redirect_url = serializers.CharField(required=False)
    invite_token = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )
    newsletter_optin = serializers.BooleanField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "is_bot",
            "add_to_project",
            "campaign_key",
            "campaign_data",
            "redirect_url",
            "invite_token",
            "newsletter_optin",
        )
        extra_kwargs = {"email": {"required": True}}

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
