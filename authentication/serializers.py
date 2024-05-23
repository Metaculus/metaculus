from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from users.models import User


class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
        )
        extra_kwargs = {"email": {"required": True}}

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("The email already exists")

        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("The username is already taken")

        return value

    def validate_password(self, value):
        validate_password(password=value)

        return value


class SignupActivationSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    token = serializers.CharField(required=True)


class LoginSerializer(serializers.Serializer):
    # username or email
    login = serializers.CharField()
    password = serializers.CharField()
