from rest_framework import serializers

from comments.models import KeyFactor
from projects.models import Project
from scoring.models import LeaderboardEntry
from users.models import User, UserCampaignRegistration

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
            "metadata",
        )

    def get_metadata(self, obj: User):
        data = obj.metadata
        if data is None or not isinstance(data, dict):
            return data
        # only bot_details is public, other public fields may be added
        return {key: value for key, value in data.items() if key == "bot_details"}


class UserPublicSerializer(serializers.ModelSerializer):
    formerly_known_as = serializers.SerializerMethodField()
    metadata = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "date_joined",
            "bio",
            "website",
            "formerly_known_as",
            "is_active",
            "is_spam",
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
            "metadata",
        )

    def get_formerly_known_as(self, obj: User):
        return obj.get_formerly_known_as()

    def get_metadata(self, obj: User):
        data = obj.metadata
        if data is None or not isinstance(data, dict):
            return data
        # only bot_details is public, other public fields may be added
        return {key: value for key, value in data.items() if key == "bot_details"}


class UserPrivateSerializer(UserPublicSerializer):
    metadata = serializers.JSONField(read_only=True)
    registered_campaigns = serializers.SerializerMethodField()
    should_suggest_keyfactors = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = UserPublicSerializer.Meta.fields + (
            "email",
            "is_superuser",
            "is_staff",
            "unsubscribed_mailing_tags",
            "hide_community_prediction",
            "is_onboarding_complete",
            "registered_campaigns",
            "should_suggest_keyfactors",
            "prediction_expiration_percent",
            "app_theme",
            "interface_type",
            "language",
        )

    def get_registered_campaigns(self, user: User):
        return [
            {
                "key": campaign.key,
                "details": campaign.details,
            }
            for campaign in UserCampaignRegistration.objects.filter(user=user)
            .exclude(key__isnull=True)
            .all()
        ]

    def get_should_suggest_keyfactors(self, user: User) -> bool:
        if user.is_bot or user.is_superuser:
            return False

        return (
            KeyFactor.objects.filter(comment__author=user).exists()
            or LeaderboardEntry.objects.filter(user=user, medal__isnull=False).exists()
        )


class UserUpdateProfileSerializer(serializers.ModelSerializer):
    website = serializers.URLField(allow_blank=True, max_length=100)

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
            "hide_community_prediction",
            "is_onboarding_complete",
            "prediction_expiration_percent",
            "app_theme",
            "interface_type",
            "language",
        )


def validate_username(value: str):
    value = serializers.RegexField(
        r"^\w([\w.@+-]*\w)?$",
        error_messages={
            "invalid": (
                "Enter a valid username. This value may contain only letters, "
                "numbers, and @/./+/-/_ characters."
            )
        },
    ).run_validation(value)

    if value.lower() in forbidden_usernames:
        raise serializers.ValidationError("this username is not allowed")

    if User.objects.filter(username__iexact=value).exists():
        raise serializers.ValidationError("The username is already taken")

    return value


class UserFilterSerializer(serializers.Serializer):
    search = serializers.CharField(required=True, min_length=3)


class PasswordChangeSerializer(serializers.Serializer):
    password = serializers.CharField()
    new_password = serializers.CharField()

    def validate(self, attrs):
        if attrs["new_password"] == attrs["password"]:
            raise serializers.ValidationError(
                "New password should not match the old one"
            )

        return attrs


class EmailChangeSerializer(serializers.Serializer):
    password = serializers.CharField()
    email = serializers.EmailField()


class UserCampaignRegistrationSerializer(serializers.ModelSerializer):
    add_to_project = serializers.IntegerField(required=False)

    class Meta:
        model = UserCampaignRegistration
        fields = ("details", "key", "add_to_project")

    def validate_add_to_project(self, value):
        try:
            return Project.objects.get(pk=value)

        except Project.DoesNotExist:
            raise serializers.ValidationError(
                "Project to add the user to doesn't exist"
            )
