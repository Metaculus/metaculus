from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from users.models import User
from users.serializers import validate_username


class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "is_bot"
        )
        extra_kwargs = {"email": {"required": True}}

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
