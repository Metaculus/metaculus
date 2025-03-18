from typing import Union, Iterable

from django.db import models
from django.db.models import QuerySet
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from comments.models import KeyFactor
from comments.serializers import serialize_key_factors_many
from misc.models import ITNArticle
from projects.models import Project
from projects.permissions import ObjectPermission
from projects.serializers.common import (
    validate_categories,
    validate_tournaments,
    serialize_projects,
)
from projects.services.common import get_projects_for_posts
from questions.models import Question, AggregateForecast
from questions.serializers import (
    QuestionWriteSerializer,
    QuestionUpdateSerializer,
    serialize_question,
    serialize_conditional,
    serialize_group,
    ConditionalWriteSerializer,
    GroupOfQuestionsWriteSerializer,
    GroupOfQuestionsUpdateSerializer,
)
from questions.services import get_aggregated_forecasts_for_questions
from questions.types import AggregationMethod
from users.models import User
from utils.dtypes import flatten, generate_map_from_list
from utils.serializers import SerializerKeyLookupMixin
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
    author_username = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    coauthors = serializers.SerializerMethodField()
    nr_forecasters = serializers.IntegerField(source="forecasters_count")
    slug = serializers.SerializerMethodField()
    url_title = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = (
            "id",
            "title",
            "short_title",
            # Backward compatibility
            "url_title",
            "slug",
            "author_id",
            "author_username",
            "coauthors",
            "created_at",
            "published_at",
            "edited_at",
            "curation_status",
            "curation_status_updated_at",
            "comment_count",
            "status",
            "resolved",
            "actual_close_time",
            "scheduled_close_time",
            "scheduled_resolve_time",
            "open_time",
            "nr_forecasters",
        )

    def get_url_title(self, obj: Post):
        # Backward compatibility field
        return obj.short_title

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

        if not obj.open_time or obj.open_time > now:
            return Post.CurationStatus.APPROVED

        if now < obj.scheduled_close_time and (
            not obj.actual_close_time or now < obj.actual_close_time
        ):
            return Post.PostStatusChange.OPEN

        return Post.PostStatusChange.CLOSED

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
    short_title = serializers.CharField(required=False)
    default_project = serializers.IntegerField(required=True)
    question = QuestionWriteSerializer(required=False)
    conditional = ConditionalWriteSerializer(required=False)
    group_of_questions = GroupOfQuestionsWriteSerializer(required=False)
    notebook = NotebookWriteSerializer(required=False)
    categories = serializers.ListField(child=serializers.IntegerField(), required=False)

    class Meta:
        model = Post
        fields = (
            "title",
            "short_title",
            "question",
            "conditional",
            "group_of_questions",
            "default_project",
            "notebook",
            "categories",
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

        return project

    def validate_categories(self, values: list[int]) -> list[Project]:
        return validate_categories(lookup_field="id", lookup_values=values)


class PostUpdateSerializer(PostWriteSerializer):
    question = QuestionUpdateSerializer(required=False)
    group_of_questions = GroupOfQuestionsUpdateSerializer(required=False)


class PostFilterSerializer(SerializerKeyLookupMixin, serializers.Serializer):
    class Order(models.TextChoices):
        PUBLISHED_AT = "published_at"
        OPEN_TIME = "open_time"
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
    default_project_id = serializers.IntegerField(required=False)
    topic = serializers.CharField(required=False)
    community = serializers.CharField(required=False)
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
    withdrawn = serializers.BooleanField(required=False, allow_null=True)
    not_forecaster_id = serializers.IntegerField(required=False, allow_null=True)
    similar_to_post_id = serializers.IntegerField(required=False, allow_null=True)
    upvoted_by = serializers.IntegerField(required=False, allow_null=True)

    search = serializers.CharField(required=False, allow_null=True)
    for_main_feed = serializers.BooleanField(required=False, allow_null=True)
    following = serializers.BooleanField(required=False, allow_null=True)

    # Key lookup filters
    open_time = serializers.DateTimeField(required=False, allow_null=True)
    published_at = serializers.DateTimeField(required=False, allow_null=True)
    scheduled_resolve_time = serializers.DateTimeField(required=False, allow_null=True)
    scheduled_close_time = serializers.DateTimeField(required=False, allow_null=True)

    key_lookup_fields = [
        "open_time",
        "published_at",
        "scheduled_resolve_time",
        "scheduled_close_time",
    ]

    def validate_default_project_id(self, value: int):
        try:
            return Project.objects.get(pk=value)
        except Project.DoesNotExist:
            raise ValidationError("Project does not exist")

    def validate_public_figure(self, value: int):
        try:
            return Project.objects.filter(pk=value)
        except Project.DoesNotExist:
            raise ValidationError("Slug does not exist")

    def validate_news_type(self, value: str):
        try:
            return Project.objects.get(
                slug__iexact=value, type=Project.ProjectTypes.NEWS_CATEGORY
            )
        except Project.DoesNotExist:
            raise ValidationError("Slug does not exist")

    def validate_topic(self, value: str):
        try:
            return Project.objects.filter_topic().get(slug=value)
        except Project.DoesNotExist:
            raise ValidationError("Slug does not exist")

    def validate_community(self, value: str):
        try:
            return Project.objects.filter_communities().get(slug=value)
        except Project.DoesNotExist:
            raise ValidationError("Community does not exist")

    def validate_tags(self, values: list[str]):
        tags = Project.objects.filter_tags().filter(slug__in=values)
        slugs = {obj.slug for obj in tags}

        for value in values:
            if value not in slugs:
                raise ValidationError(f"Tag {value} does not exist")

        return tags

    def validate_categories(self, values: list[str]):
        return validate_categories(lookup_field="slug", lookup_values=values)

    def validate_tournaments(self, values: list[str]):
        return validate_tournaments(lookup_values=values)

    def validate_forecast_type(self, value):
        # If the value is passed as a single string, split it by commas
        if isinstance(value, list) and len(value) == 1:
            return [v.strip() for v in value[0].split(",")]
        return value

    def validate_order_by(self, value: str):
        if value.lstrip("-") in self.Order:
            return value

        return


class OldQuestionFilterSerializer(SerializerKeyLookupMixin, serializers.Serializer):
    status = serializers.MultipleChoiceField(
        choices=["open", "closed"],
        required=False,
    )
    project = serializers.IntegerField(required=False)
    guessed_by = serializers.IntegerField(required=False)
    order_by = serializers.CharField(required=False, allow_null=True)
    not_guessed_by = serializers.IntegerField(required=False)

    # Key lookup filters
    published_at = serializers.DateTimeField(required=False, allow_null=True)
    scheduled_resolve_time = serializers.DateTimeField(required=False, allow_null=True)
    scheduled_close_time = serializers.DateTimeField(required=False, allow_null=True)

    key_lookup_fields = [
        "published_at",
        "scheduled_resolve_time",
        "scheduled_close_time",
    ]

    def validate_project(self, value):
        return validate_tournaments(lookup_values=[str(value)])

    def validate_order_by(self, value: str):
        order_by = value.lstrip("-")
        if order_by == "hotness":
            return "activity"
        if order_by in PostFilterSerializer.Order:
            return value

        return


def serialize_post(
    post: Post,
    with_cp: bool = False,
    current_user: User = None,
    with_subscriptions: bool = False,
    aggregate_forecasts: dict[Question, AggregateForecast] = None,
    key_factors: list[dict] = None,
    projects: Iterable[Project] = None,
) -> dict:
    current_user = (
        current_user if current_user and not current_user.is_anonymous else None
    )
    serialized_data = PostReadSerializer(post).data

    # Appending projects
    projects = projects or []
    serialized_data["projects"] = serialize_projects(projects, post.default_project)

    # Appending questions
    if post.question:
        serialized_data["question"] = serialize_question(
            post.question,
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

    serialized_data["key_factors"] = key_factors or []

    is_current_content_translated = (
        post.is_current_content_translated()
        or (post.question is not None and post.question.is_current_content_translated())
        or (post.notebook is not None and post.notebook.is_current_content_translated())
    )

    serialized_data["is_current_content_translated"] = is_current_content_translated

    return serialized_data


def serialize_post_many(
    posts: Union[QuerySet[Post], list[Post], list[int] | set[int]],
    with_cp: bool = False,
    current_user: User = None,
    with_subscriptions: bool = False,
    group_cutoff: int = None,
    with_key_factors: bool = False,
) -> list[dict]:
    current_user = (
        current_user if current_user and not current_user.is_anonymous else None
    )
    ids = [p.id if isinstance(p, Post) else p for p in posts]
    qs = Post.objects.filter(id__in=ids)

    qs = (
        qs.annotate_user_permission(user=current_user)
        .prefetch_questions()
        .prefetch_condition_post()
        .select_related("default_project__primary_leaderboard", "author", "notebook")
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
    posts = sorted(qs.all(), key=lambda obj: ids.index(obj.id))
    aggregate_forecasts = {}

    if with_cp:
        aggregate_forecasts = get_aggregated_forecasts_for_questions(
            flatten([p.get_questions() for p in posts]), group_cutoff=group_cutoff
        )

    comment_key_factors_map = {}

    if with_key_factors:
        comment_key_factors_map = generate_map_from_list(
            serialize_key_factors_many(
                KeyFactor.objects.for_posts(posts)
                .filter_active()
                .order_by("-votes_score"),
                current_user=current_user,
            ),
            key=lambda x: x["post_id"],
        )

    # Fetch projects
    projects_map = get_projects_for_posts(posts, user=current_user)

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
            key_factors=comment_key_factors_map.get(post.id),
            projects=projects_map.get(post.id),
        )
        for post in posts
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


class DownloadDataSerializer(serializers.Serializer):
    question_id = serializers.IntegerField(required=False)
    post_id = serializers.IntegerField(required=False)
    sub_question = serializers.IntegerField(required=False)
    aggregation_methods = serializers.CharField(required=False)
    user_ids = serializers.CharField(required=False, allow_null=True)
    include_comments = serializers.BooleanField(required=False, default=False)
    include_scores = serializers.BooleanField(required=False, default=True)
    include_bots = serializers.BooleanField(required=False, allow_null=True)
    minimize = serializers.BooleanField(required=False, default=True)
    anonymized = serializers.BooleanField(required=False)

    def validate_aggregation_methods(self, value: str | None):
        if value is None:
            return
        user: User = self.context.get("user")
        if value == "all":
            aggregation_methods = [
                AggregationMethod.RECENCY_WEIGHTED,
                AggregationMethod.UNWEIGHTED,
                AggregationMethod.METACULUS_PREDICTION,
            ]
            if user.is_staff:
                aggregation_methods.append(AggregationMethod.SINGLE_AGGREGATION)
            return aggregation_methods
        methods: list[str] = [v.strip() for v in value.split(",")]
        invalid_methods = [
            method for method in methods if method not in AggregationMethod.values
        ]
        if invalid_methods:
            raise serializers.ValidationError(
                f"Invalid aggregation method(s): {', '.join(invalid_methods)}"
            )
        if not user.is_staff:
            methods = [
                method
                for method in methods
                if method != AggregationMethod.SINGLE_AGGREGATION
            ]
        return methods

    def validate_user_ids(self, value):
        if not value:
            return value
        user_ids = value.split(",")
        if not all(user_id.isdigit() for user_id in user_ids):
            raise serializers.ValidationError(
                "Invalid user_ids. Must be a comma-separated list of integers."
            )
        if not (self.context.get("is_staff") or self.context.get("is_whitelisted")):
            raise serializers.ValidationError(
                "Current user cannot view user-specific data. "
                "Please remove user_ids parameter."
            )
        uids = [int(user_id) for user_id in user_ids]
        return uids

    def validate(self, attrs):
        # Check if there are any unexpected fields
        allowed_fields = {
            "post_id",
            "question_id",
            "sub_question",
            "aggregation_methods",
            "user_ids",
            "include_comments",
            "include_scores",
            "include_bots",
            "minimize",
        }
        input_fields = set(self.initial_data.keys())
        unexpected_fields = input_fields - allowed_fields
        if unexpected_fields:
            raise ValidationError(f"Unexpected fields: {', '.join(unexpected_fields)}")

        # Aggregation validation logic
        aggregation_methods = attrs.get("aggregation_methods")
        user_ids = attrs.get("user_ids")
        include_bots = attrs.get("include_bots")
        minimize = attrs.get("minimize", True)

        if not aggregation_methods and (
            (user_ids is not None) or (include_bots is not None) or not minimize
        ):
            raise serializers.ValidationError(
                "If user_ids, include_bots, or minimize is set, "
                "aggregation_methods must also be set."
            )

        return attrs
