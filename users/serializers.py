from rest_framework import serializers

from users.models import User

forbidden_usernames = [
    "anonymous",
    "moderator",
    "moderators",
    "predictor",
    "predictors",
    "metaculus",
    "admin",
    "admins",
]


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "date_joined", "bio", "website")


class UserPrivateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = UserPublicSerializer.Meta.fields + ("first_name", "last_name", "email")


def validate_username(value: str):
    if value.lower() in forbidden_usernames:
        raise serializers.ValidationError({"username": "this username is not allowed"})

    if User.objects.filter(username__iexact=value).exists():
        raise serializers.ValidationError("The username is already taken")

    return value
