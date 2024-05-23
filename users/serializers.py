from rest_framework import serializers

from users.models import User


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "date_joined", "bio", "website")


class UserPrivateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = UserPublicSerializer.Meta.fields + ("first_name", "last_name", "email")
