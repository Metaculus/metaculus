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
)
from projects.services import get_site_main_project
from questions.models import Question, AggregateForecast
from questions.serializers import (
    QuestionWriteSerializer,
    serialize_question,
    serialize_conditional,
    serialize_group,
    ConditionalWriteSerializer,
    GroupOfQuestionsWriteSerializer,
    GroupOfQuestionsUpdateSerializer,
)
from questions.services import get_aggregated_forecasts_for_questions
from users.models import User
from utils.dtypes import flatten
from .models import Notebook, Post, PostSubscription
from .utils import get_post_slug


class NotebookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notebook
        fields = (
            "id",
            "markdown",
            "type",
            "image_url",
            "created_at",
            "edited_at",
        )


class PostReadSerializer(serializers.ModelSerializer):
    projects = serializers.SerializerMethodField()
    author_username = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    open_time = serializers.SerializerMethodField()
    coauthors = serializers.SerializerMethodField()
    nr_forecasters = serializers.IntegerField(source="forecasters_count")
    slug = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            "id",
            "title",
            "url_title",
            "slug",
            "author_id",
            "author_username",
            "coauthors",
            "projects",
            "created_at",
            "published_at",
            "edited_at",
            "curation_status",
            "comment_count",
            "status",
            "resolved",
            "actual_close_time",
            "scheduled_close_time",
            "scheduled_resolve_time",
            "open_time",
            "nr_forecasters",
        )

    def get_projects(self, obj: Post):
        return serialize_projects(obj.projects.all(), obj.default_project)

    def get_author_username(self, obj: Post):
        return obj.author.username

    def get_coauthors(self, obj: Post):
        return [{"id": u.id, "username": u.username} for u in obj.coauthors.all()]

    def get_status(self, obj: Post):
        if obj.notebook or obj.curation_status != Post.CurationStatus.APPROVED:
            return obj.curation_status

        if obj.resolved:
            return Post.PostStatusChange.RESOLVED

        now = timezone.now()
        open_time = obj.get_open_time()

        if not open_time or open_time > now:
            return Post.CurationStatus.APPROVED

        if now < obj.scheduled_close_time:
            return Post.PostStatusChange.OPEN

        return Post.PostStatusChange.CLOSED

    def get_open_time(self, obj: Post):
        return obj.get_open_time()

    def get_slug(self, obj: Post):
        return get_post_slug(obj)


class NotebookWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notebook
        fields = (
            "markdown",
            "type",
            "image_url",
        )


class PostWriteSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=False)
    url_title = serializers.CharField(required=False)
    default_project = serializers.IntegerField(required=True)
    question = QuestionWriteSerializer(required=False)
    conditional = ConditionalWriteSerializer(required=False)
    group_of_questions = GroupOfQuestionsWriteSerializer(required=False)
    notebook = NotebookWriteSerializer(required=False)
    categories = serializers.ListField(child=serializers.IntegerField(), required=False)
    news_type = serializers.CharField(required=False, allow_null=True)

    class Meta:
        model = Post
        fields = (
            "title",
            "url_title",
            "question",
            "conditional",
            "group_of_questions",
            "default_project",
            "notebook",
            "published_at",
            "categories",
            "news_type",
        )

    def get_user(self):
        return self.context["user"]

    def validate_default_project(self, value):
        project = (
            Project.objects.filter_permission(user=self.get_user())
            .filter(pk=value)
            .first()
        )

        if not project:
            raise ValidationError("Wrong default project id")

        if (
            project.user_permission
            not in ObjectPermission.get_included_permissions(ObjectPermission.CURATOR)
            and project != get_site_main_project()
        ):
            raise ValidationError(
                "You don't have permissions to assign post to this project"
            )

        return project

    def validate_categories(self, values: list[int]) -> list[Project]:
        return validate_categories(lookup_field="id", lookup_values=values)

    def validate_news_type(self, value) -> list[Project]:
        if not value:
            return value

        obj = Project.objects.filter_news().filter(name__iexact=value).first()

        if not obj:
            raise ValidationError("Wrong news type")

        return obj


class PostUpdateSerializer(PostWriteSerializer):
    group_of_questions = GroupOfQuestionsUpdateSerializer(required=False)


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
    curation_status = serializers.ChoiceField(
        required=False, choices=Post.CurationStatus.choices
    )
    notebook_type = serializers.ChoiceField(
        choices=Notebook.NotebookType.choices, required=False, allow_null=True
    )
    news_type = serializers.CharField(required=False)
    public_figure = serializers.CharField(required=False)
    usernames = serializers.ListField(child=serializers.CharField(), required=False)
    forecaster_id = serializers.IntegerField(required=False, allow_null=True)
    not_forecaster_id = serializers.IntegerField(required=False, allow_null=True)
    similar_to_post_id = serializers.IntegerField(required=False, allow_null=True)

    search = serializers.CharField(required=False, allow_null=True)
    for_main_feed = serializers.BooleanField(required=False, allow_null=True)

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
    guessed_by = serializers.IntegerField(required=False)
    not_guessed_by = serializers.IntegerField(required=False)

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
    aggregate_forecasts: dict[Question, AggregateForecast] = None,
) -> dict:
    current_user = (
        current_user if current_user and not current_user.is_anonymous else None
    )
    serialized_data = PostReadSerializer(post).data

    if post.question:
        serialized_data["question"] = serialize_question(
            post.question,
            with_cp=with_cp,
            current_user=current_user,
            post=post,
            aggregate_forecasts=(
                aggregate_forecasts[post.question] or []
                if aggregate_forecasts
                else None
            ),
        )

    if post.conditional:
        serialized_data["conditional"] = serialize_conditional(
            post.conditional,
            with_cp=with_cp,
            current_user=current_user,
            post=post,
            aggregate_forecasts=aggregate_forecasts,
        )

    if post.group_of_questions:
        serialized_data["group_of_questions"] = serialize_group(
            post.group_of_questions,
            with_cp=with_cp,
            current_user=current_user,
            post=post,
            aggregate_forecasts=aggregate_forecasts,
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
    serialized_data["forecasts_count"] = post.forecasts_count

    # Subscriptions
    if with_subscriptions and current_user:
        serialized_data["subscriptions"] = [
            get_subscription_serializer_by_type(sub.type)(sub).data
            for sub in post.user_subscriptions
            if not sub.is_global
        ]

    if hasattr(post, "user_snapshots") and current_user and post.user_snapshots:
        snapshot = post.user_snapshots[0]
        unread_comment_count = (post.comment_count or 0) - (
            snapshot.comments_count or 0
        )

        # Unread comment stats were synced from the old db
        # This workaround fixes possible discrepancies
        if unread_comment_count < 0:
            unread_comment_count = 0

        serialized_data.update(
            {
                "unread_comment_count": unread_comment_count,
                "last_viewed_at": snapshot.viewed_at,
            }
        )

    return serialized_data


def serialize_post_many(
    posts: Union[Post.objects, list[Post], list[int]],
    with_cp: bool = False,
    current_user: User = None,
    with_subscriptions: bool = False,
    group_cutoff: int = None,
) -> list[dict]:
    current_user = (
        current_user if current_user and not current_user.is_anonymous else None
    )
    ids = [p.pk if isinstance(p, Post) else p for p in posts]
    qs = Post.objects.filter(pk__in=ids)

    qs = (
        qs.annotate_user_permission(user=current_user)
        .prefetch_projects()
        .prefetch_questions()
        .prefetch_condition_post()
        .select_related("author", "notebook")
        .prefetch_related("coauthors")
    )
    if current_user:
        qs = qs.annotate_user_vote(current_user)

    if with_cp:
        qs = qs.prefetch_questions_scores()

        if current_user:
            qs = qs.prefetch_user_forecasts(current_user.id)

    if with_subscriptions and current_user:
        qs = qs.prefetch_user_subscriptions(user=current_user)

    if current_user:
        qs = qs.prefetch_user_snapshots(current_user)

    # Restore the original ordering
    objects = list(qs.all())
    objects.sort(key=lambda obj: ids.index(obj.id))

    aggregate_forecasts = {}

    if with_cp:
        aggregate_forecasts = get_aggregated_forecasts_for_questions(
            flatten([p.get_questions() for p in objects]), group_cutoff=group_cutoff
        )

    return [
        serialize_post(
            post,
            with_cp=with_cp,
            current_user=current_user,
            with_subscriptions=with_subscriptions,
            aggregate_forecasts={
                q: v
                for q, v in aggregate_forecasts.items()
                if q in post.get_questions()
            },
        )
        for post in objects
    ]


class SubscriptionNewCommentsSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = PostSubscription
        fields = (
            "id",
            "type",
            "comments_frequency",
            "created_at",
        )


class SubscriptionMilestoneSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False, allow_null=True)
    milestone_step = serializers.FloatField(min_value=0, max_value=1)

    class Meta:
        model = PostSubscription
        fields = (
            "id",
            "type",
            "milestone_step",
            "created_at",
        )


class SubscriptionCPChangeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False, allow_null=True)
    cp_change_threshold = serializers.FloatField(min_value=0, max_value=1)

    class Meta:
        model = PostSubscription
        fields = (
            "id",
            "type",
            "cp_change_threshold",
            "created_at",
        )


class SubscriptionStatusChangeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = PostSubscription
        fields = (
            "id",
            "type",
            "created_at",
        )


class SubscriptionSpecificTimeSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False, allow_null=True)
    recurrence_interval = serializers.DurationField(required=False, allow_null=True)

    class Meta:
        model = PostSubscription
        fields = (
            "id",
            "type",
            "next_trigger_datetime",
            "recurrence_interval",
            "created_at",
        )

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
