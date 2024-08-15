from typing import Union

from django.db import models
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from misc.models import ITNArticle
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.serializers import (
    validate_categories,
    validate_tournaments,
    serialize_projects,
    PostProjectWriteSerializer,
)
from questions.serializers import (
    QuestionWriteSerializer,
    serialize_question,
    serialize_conditional,
    serialize_group,
    ConditionalWriteSerializer,
    GroupOfQuestionsWriteSerializer,
)
from users.models import User
from .models import Notebook, Post, PostSubscription


class NotebookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notebook
        fields = "__all__"


class PostSerializer(serializers.ModelSerializer):
    projects = serializers.SerializerMethodField()
    author_username = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            "id",
            "title",
            "url_title",
            "author_id",
            "author_username",
            "projects",
            "created_at",
            "published_at",
            "edited_at",
            "curation_status",
            "comment_count",
            "status",
            "actual_close_time",
            "resolved",
            "scheduled_close_time",
            "scheduled_resolve_time",
            "maybe_try_to_resolve_at",
        )

    def get_projects(self, obj: Post):
        return serialize_projects(obj.projects.all(), obj.default_project)

    def get_author_username(self, obj: Post):
        return obj.author.username

    def get_status(self, obj: Post):
        if obj.resolved:
            return "resolved"
        if obj.actual_close_time and obj.actual_close_time < timezone.now():
            return "closed"
        return obj.curation_status


class NotebookWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notebook
        fields = (
            "markdown",
            "type",
            "image_url",
        )


class PostWriteSerializer(serializers.ModelSerializer):
    projects = PostProjectWriteSerializer(required=False)
    question = QuestionWriteSerializer(required=False)
    conditional = ConditionalWriteSerializer(required=False)
    group_of_questions = GroupOfQuestionsWriteSerializer(required=False)
    notebook = NotebookWriteSerializer(required=False)

    class Meta:
        model = Post
        fields = (
            "title",
            "url_title",
            "projects",
            "question",
            "conditional",
            "group_of_questions",
            "default_project_id",
            "notebook",
            "published_at",
        )


class PostFilterSerializer(serializers.Serializer):
    # TODO: ignore incorrect filter options in case of error, so users with old links could get results
    class Order(models.TextChoices):
        PUBLISHED_AT = "published_at"
        VOTES = "vote_score"
        COMMENT_COUNT = "comment_count"
        FORECASTS_COUNT = "forecasts_count"
        SCHEDULED_CLOSE_TIME = "scheduled_close_time"
        SCHEDULED_RESOLVE_TIME = "scheduled_resolve_time"
        USER_LAST_FORECASTS_DATE = "user_last_forecasts_date"
        UNREAD_COMMENT_COUNT = "unread_comment_count"
        WEEKLY_MOVEMENT = "weekly_movement"
        DIVERGENCE = "divergence"
        HOTNESS = "hotness"
        SCORE = "score"

    class Access(models.TextChoices):
        PRIVATE = "private"
        PUBLIC = "public"

    ids = serializers.ListField(child=serializers.IntegerField(), required=False)
    access = serializers.ChoiceField(required=False, choices=Access.choices)
    topic = serializers.CharField(required=False)
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    categories = serializers.ListField(child=serializers.CharField(), required=False)
    tournaments = serializers.ListField(child=serializers.CharField(), required=False)
    forecast_type = serializers.ListField(child=serializers.CharField(), required=False)
    statuses = serializers.ListField(child=serializers.CharField(), required=False)
    permission = serializers.ChoiceField(
        required=False,
        choices=ObjectPermission.choices + [ObjectPermission.CREATOR],
    )
    order_by = serializers.CharField(required=False, allow_null=True)
    notebook_type = serializers.ChoiceField(
        choices=Notebook.NotebookType.choices, required=False, allow_null=True
    )
    news_type = serializers.CharField(required=False)
    public_figure = serializers.CharField(required=False)
    usernames = serializers.ListField(child=serializers.CharField(), required=False)
    forecaster_id = serializers.IntegerField(required=False, allow_null=True)
    similar_to_post_id = serializers.IntegerField(required=False, allow_null=True)

    search = serializers.CharField(required=False, allow_null=True)

    def validate_public_figure(self, value: int):
        try:
            return Project.objects.filter(pk=value)
        except Project.DoesNotExist:
            raise ValidationError("Slug does not exist")

    def validate_news_type(self, value: str):
        try:
            return Project.objects.get(
                name__iexact=value, type=Project.ProjectTypes.NEWS_CATEGORY
            )
        except Project.DoesNotExist:
            raise ValidationError("Slug does not exist")

    def validate_topic(self, value: str):
        try:
            return Project.objects.filter_topic().filter_active().get(slug=value)
        except Project.DoesNotExist:
            raise ValidationError("Slug does not exist")

    def validate_tags(self, values: list[str]):
        tags = Project.objects.filter_tags().filter_active().filter(slug__in=values)
        slugs = {obj.slug for obj in tags}

        for value in values:
            if value not in slugs:
                raise ValidationError(f"Tag {value} does not exist")

        return tags

    def validate_categories(self, values: list[str]):
        return validate_categories(lookup_field="slug", lookup_values=values)

    def validate_tournaments(self, values: list[str]):
        return validate_tournaments(lookup_values=values)

    def validate_order_by(self, value: str):
        if value.lstrip("-") in self.Order:
            return value

        return


class OldQuestionFilterSerializer(PostFilterSerializer):
    status = serializers.MultipleChoiceField(
        choices=["open", "closed"],
        required=False,
    )
    project = serializers.IntegerField(required=False)

    def validate_project(self, value):
        return validate_tournaments(lookup_values=[str(value)])

    def validate_order_by(self, value: str):
        order_by = value.lstrip("-")
        if order_by == "hotness":
            return "activity"
        if order_by in self.Order:
            return value

        return


def serialize_post(
    post: Post,
    with_cp: bool = False,
    current_user: User = None,
    with_subscriptions: bool = False,
) -> dict:
    current_user = (
        current_user if current_user and not current_user.is_anonymous else None
    )
    serialized_data = PostSerializer(post).data

    if post.question:
        serialized_data["question"] = serialize_question(
            post.question, with_cp=with_cp, current_user=current_user, post=post
        )

    if post.conditional:
        serialized_data["conditional"] = serialize_conditional(
            post.conditional,
            with_cp=with_cp,
            current_user=current_user,
            post=post,
        )

    if post.group_of_questions:
        serialized_data["group_of_questions"] = serialize_group(
            post.group_of_questions,
            with_cp=with_cp,
            current_user=current_user,
            post=post,
        )

    if post.notebook:
        serialized_data["notebook"] = NotebookSerializer(post.notebook).data

    # Permissions
    serialized_data["user_permission"] = post.user_permission

    # Annotate user's vote
    serialized_data["vote"] = {
        "score": post.vote_score,
        "user_vote": post.user_vote,
    }
    # Forecasters
    serialized_data["nr_forecasters"] = post.nr_forecasters

    # Subscriptions
    if with_subscriptions and current_user:
        serialized_data["subscriptions"] = [
            get_subscription_serializer_by_type(sub.type)(sub).data
            for sub in post.user_subscriptions
            if not sub.is_global
        ]

    serialized_data["forecasts_count"] = post.forecasts_count
    return serialized_data


def serialize_post_many(
    data: Union[Post.objects, list[Post]],
    with_cp: bool = False,
    current_user: User = None,
    with_subscriptions: bool = False,
) -> list[dict]:
    current_user = (
        current_user if current_user and not current_user.is_anonymous else None
    )
    ids = [p.pk for p in data]
    qs = Post.objects.filter(pk__in=ids)

    qs = (
        qs.annotate_user_permission(user=current_user)
        .annotate_vote_score()
        .prefetch_projects()
        .prefetch_questions()
        .annotate_comment_count()
        .select_related("author")
    )
    if current_user:
        qs = qs.annotate_user_vote(current_user)

    if with_cp:
        # Clear auto-defer of the forecasts list field
        qs = qs.defer(None)

        if current_user:
            qs = qs.prefetch_user_forecasts(current_user.id)

    if with_subscriptions and current_user:
        qs = qs.prefetch_user_subscriptions(user=current_user)

    # Restore the original ordering
    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    return [
        serialize_post(
            post,
            with_cp=with_cp,
            current_user=current_user,
            with_subscriptions=with_subscriptions,
        )
        for post in objects
    ]


class SubscriptionNewCommentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostSubscription
        fields = (
            "type",
            "comments_frequency",
        )


class SubscriptionMilestoneSerializer(serializers.ModelSerializer):
    milestone_step = serializers.FloatField(min_value=0, max_value=1)

    class Meta:
        model = PostSubscription
        fields = (
            "type",
            "milestone_step",
        )


class SubscriptionCPChangeSerializer(serializers.ModelSerializer):
    cp_change_threshold = serializers.FloatField(min_value=0, max_value=1)

    class Meta:
        model = PostSubscription
        fields = (
            "type",
            "cp_change_threshold",
        )


class SubscriptionStatusChangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostSubscription
        fields = ("type",)


class SubscriptionSpecificTimeSerializer(serializers.ModelSerializer):
    recurrence_interval = serializers.DurationField(required=False, allow_null=True)

    class Meta:
        model = PostSubscription
        fields = ("type", "next_trigger_datetime", "recurrence_interval")

    def validate_next_trigger_datetime(self, value):
        if value <= timezone.now():
            raise ValidationError("Can not be in the past")

        return value

    def validate_recurrence_interval(self, value):
        if not value:
            return

        return value


def get_subscription_serializer_by_type(
    subscription_type: PostSubscription.SubscriptionType,
) -> type[serializers.Serializer]:
    serializers_map = {
        PostSubscription.SubscriptionType.NEW_COMMENTS: SubscriptionNewCommentsSerializer,
        PostSubscription.SubscriptionType.MILESTONE: SubscriptionMilestoneSerializer,
        PostSubscription.SubscriptionType.STATUS_CHANGE: SubscriptionStatusChangeSerializer,
        PostSubscription.SubscriptionType.SPECIFIC_TIME: SubscriptionSpecificTimeSerializer,
        PostSubscription.SubscriptionType.CP_CHANGE: SubscriptionCPChangeSerializer,
    }

    if subscription_type not in serializers_map:
        raise ValidationError("Wrong subscription type")

    return serializers_map[subscription_type]


class PostRelatedArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ITNArticle
        fields = ("id", "title", "url", "favicon_url", "created_at", "media_label")
