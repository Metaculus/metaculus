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
    "curator",
    "curators",
]


class BaseUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "is_bot",
            "is_staff",
        )


class UserPublicSerializer(serializers.ModelSerializer):
    formerly_known_as = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "date_joined",
            "bio",
            "website",
            "formerly_known_as",
            "is_bot",
            "twitter",
            "linkedin",
            "facebook",
            "github",
            "good_judgement_open",
            "kalshi",
            "manifold",
            "infer",
            "hypermind",
            "occupation",
            "location",
            "profile_picture",
            "first_name",
            "last_name",
        )

    def get_formerly_known_as(self, obj: User):
        return obj.get_formerly_known_as()


class UserPrivateSerializer(UserPublicSerializer):
    class Meta:
        model = User
        fields = UserPublicSerializer.Meta.fields + (
            "email",
            "is_superuser",
            "unsubscribed_mailing_tags",
        )


class UserUpdateProfileSerializer(serializers.ModelSerializer):
    website = serializers.URLField(allow_blank=True)

    class Meta:
        model = User
        fields = (
            "bio",
            "website",
            "is_bot",
            "twitter",
            "linkedin",
            "facebook",
            "github",
            "good_judgement_open",
            "kalshi",
            "manifold",
            "infer",
            "hypermind",
            "occupation",
            "location",
            "profile_picture",
            "unsubscribed_mailing_tags",
        )


def validate_username(value: str):
    value = serializers.RegexField(r"^\w([\w.@+-]*\w)?$").run_validation(value)

    if value.lower() in forbidden_usernames:
        raise serializers.ValidationError("this username is not allowed")

    if User.objects.filter(username__iexact=value).exists():
        raise serializers.ValidationError("The username is already taken")

    return value


class UserFilterSerializer(serializers.Serializer):
    search = serializers.CharField(required=True, min_length=3)
