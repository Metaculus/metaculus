from rest_framework import serializers

from users.models import User, UserCampaignRegistration
from projects.models import Project

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
        )

    def get_formerly_known_as(self, obj: User):
        return obj.get_formerly_known_as()


class UserPrivateSerializer(UserPublicSerializer):
    registered_campaign_keys = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = UserPublicSerializer.Meta.fields + (
            "email",
            "is_superuser",
            "is_staff",
            "unsubscribed_mailing_tags",
            "hide_community_prediction",
            "is_onboarding_complete",
            "registered_campaign_keys",
        )

    def get_registered_campaign_keys(self, user: User):
        return list(
            UserCampaignRegistration.objects.filter(user=user)
            .exclude(key__isnull=True)
            .values_list("key", flat=True)
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
