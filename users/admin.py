from datetime import timedelta

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Count, Exists, OuterRef, Q, F, QuerySet

from users.models import User, UserCampaignRegistration, UserSpamActivity
from users.services.spam_detection import (
    check_profile_data_for_spam,
    send_deactivation_email,
)
from questions.models import Forecast


class LastLoginFilter(admin.SimpleListFilter):
    title = "Last Login"
    parameter_name = "last_login"

    def lookups(self, request, model_admin):
        return [
            ("0", "Never"),
            ("1", "Within 1 Day of Joining"),
            ("2-7", "2-7 Days after Joining"),
            ("7+", "More than 7 Days after Joining"),
        ]

    def queryset(self, request, queryset):
        if self.value() == "0":
            return queryset.filter(last_login__isnull=True)
        if self.value() == "1":
            return queryset.filter(last_login__lt=F("date_joined") + timedelta(days=1))
        if self.value() == "2-7":
            return queryset.filter(
                last_login__gte=F("date_joined") + timedelta(days=1),
                last_login__lt=F("date_joined") + timedelta(days=7),
            )
        if self.value() == "7+":
            return queryset.filter(last_login__gte=F("date_joined") + timedelta(days=7))
        return queryset


class AuthoredPostsFilter(admin.SimpleListFilter):
    title = "Authored Posts"
    parameter_name = "authored_posts"

    def lookups(self, request, model_admin):
        return [("0", "No Posts"), ("1-3", "1-3 Posts"), ("3+", ">3 Posts")]

    def queryset(self, request, queryset):
        if self.value() == "0":
            return queryset.annotate(authored_posts_count=Count("posts")).filter(
                authored_posts_count=0
            )
        if self.value() == "1-3":
            return queryset.annotate(authored_posts_count=Count("posts")).filter(
                authored_posts_count__gt=0, authored_posts_count__lte=3
            )
        if self.value() == "3+":
            return queryset.annotate(authored_posts_count=Count("posts")).filter(
                authored_posts_count__gt=3
            )
        return queryset


class AuthoredCommentsFilter(admin.SimpleListFilter):
    title = "Authored Comments"
    parameter_name = "authored_comments"

    def lookups(self, request, model_admin):
        return [("0", "No Comments"), ("1+", "Has Comments")]

    def queryset(self, request, queryset):
        if self.value() == "0":
            return queryset.annotate(authored_comments_count=Count("comment")).filter(
                authored_comments_count=0
            )
        if self.value() == "1+":
            return queryset.annotate(authored_comments_count=Count("comment")).filter(
                authored_comments_count__gt=0
            )
        return queryset


class ForecastedFilter(admin.SimpleListFilter):
    title = "Forecasted"
    parameter_name = "forecasted"

    def lookups(self, request, model_admin):
        return [("Yes", "Has Forecasted"), ("No", "Has Not Forecasted")]

    def queryset(self, request, queryset):
        if self.value() == "Yes":
            return queryset.filter(forecasted=True)
        if self.value() == "No":
            return queryset.filter(forecasted=False)
        return queryset


class BioLengthFilter(admin.SimpleListFilter):
    title = "Bio Length"
    parameter_name = "bio_length"

    def lookups(self, request, model_admin):
        return [("0", "No Bio"), ("1+", "Has Bio")]

    def queryset(self, request, queryset):
        if self.value() == "0":
            return queryset.filter(Q(bio__isnull=True) | Q(bio=""))
        if self.value() == "1+":
            return queryset.exclude(Q(bio__isnull=True) | Q(bio=""))
        return queryset


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = [
        "username",
        "id",
        "email",
        "is_active",
        "is_spam",
        "is_bot",
        "duration_joined_to_last_login",
        "authored_posts",
        "duration_before_first_post",
        "forecasted",
        "duration_to_last_forecast",
        "authored_comments",
        "bio_length",
    ]
    can_delete = False
    actions = [
        "mark_selected_as_spam",
        "soft_delete_selected",
        "hard_delete_selected",
        "run_profile_spam_detection_on_selected",
    ]
    search_fields = ["username", "email", "pk"]
    list_filter = [
        "is_active",
        "is_spam",
        "is_bot",
        "date_joined",
        LastLoginFilter,
        AuthoredPostsFilter,
        AuthoredCommentsFilter,
        ForecastedFilter,
        BioLengthFilter,
    ]

    def get_actions(self, request):
        actions = super().get_actions(request)
        if "delete_selected" in actions:
            del actions["delete_selected"]
        return actions

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        qs = qs.annotate(
            authored_posts_count=Count("posts"),
            authored_comments_count=Count("comment"),
            forecasted=Exists(Forecast.all_objects.filter(author=OuterRef("pk"))),
        )
        return qs

    def authored_posts(self, obj):
        count = getattr(obj, "authored_posts_count", 0)
        if count == 0:
            return "0"
        url = reverse("admin:posts_post_changelist") + "?" + f"author_id={obj.id}"
        return format_html('<a href="{}">{} Posts</a>', url, count)

    authored_posts.admin_order_field = "authored_posts_count"
    authored_posts.short_description = "Posts"

    def duration_joined_to_last_login(self, obj):
        if obj.last_login:
            return obj.last_login - obj.date_joined
        return None

    def duration_before_first_post(self, obj):
        posts = obj.posts.order_by("created_at")
        if posts.exists():
            return posts.first().created_at - obj.date_joined
        return None

    duration_before_first_post.short_description = "Time to First Post"

    def forecasted(self, obj):
        return getattr(obj, "forecasted", False)

    forecasted.boolean = True  # Display as a boolean icon in admin

    def duration_to_last_forecast(self, obj):
        if not getattr(obj, "forecasted", False):
            return None
        forecasts = Forecast.all_objects.filter(author=obj).order_by("-start_time")
        if forecasts.exists():
            return forecasts.first().start_time - obj.date_joined
        return None

    duration_to_last_forecast.short_description = "Time to Last Forecast"

    def authored_comments(self, obj):
        return getattr(obj, "authored_comments_count", 0)

    authored_comments.short_description = "Comments"

    def bio_length(self, obj):
        return len(obj.bio) if obj.bio else 0

    def mark_selected_as_spam(self, request, queryset: QuerySet[User]):
        for user in queryset:
            user.mark_as_spam()

    def soft_delete_selected(self, request, queryset: QuerySet[User]):
        for user in queryset:
            user.soft_delete()

    def hard_delete_selected(self, request, queryset: QuerySet[User]):
        queryset.delete()

    def run_profile_spam_detection_on_selected(self, request, queryset: QuerySet[User]):
        for user in queryset:
            is_spam, _ = check_profile_data_for_spam(
                user=user,
                bio=user.bio,
                website=user.website,
            )

            if is_spam:
                user.mark_as_spam()
                send_deactivation_email(user.email)


@admin.register(UserCampaignRegistration)
class UserCampaignRegistrationAdmin(admin.ModelAdmin):
    list_display = ["user", "key", "details"]
    readonly_fields = ["user", "key"]
    search_fields = ["user__username", "user__email"]


@admin.register(UserSpamActivity)
class UserSpamActivityAdmin(admin.ModelAdmin):
    list_display = ["user", "content_type", "content_id", "confidence", "reason"]
    readonly_fields = [
        "user",
        "content_type",
        "content_id",
        "confidence",
        "reason",
        "text",
    ]
    search_fields = ["user__username", "user__email"]
