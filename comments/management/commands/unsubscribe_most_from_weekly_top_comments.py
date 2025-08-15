from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import F, Func, Value

from notifications.constants import MailingTags
from questions.models import Forecast
from comments.models import Comment, CommentVote, KeyFactorVote
from users.models import User


class Command(BaseCommand):
    help = (
        "Unsubscribe all users from WEEKLY_TOP_COMMENTS except active users in the last 6 months. "
        "Active users are those who forecasted, commented, or voted (comment or key factor). "
        "Also ensures active users are subscribed by removing the tag if present."
    )

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=180)

        # Build active user set based on recent activity
        forecast_user_ids = set(
            Forecast.objects.filter(start_time__gte=cutoff)
            .values_list("author_id", flat=True)
            .distinct()
        )
        comment_user_ids = set(
            Comment.objects.filter(created_at__gte=cutoff)
            .values_list("author_id", flat=True)
            .distinct()
        )
        comment_vote_user_ids = set(
            CommentVote.objects.filter(created_at__gte=cutoff)
            .values_list("user_id", flat=True)
            .distinct()
        )
        key_factor_vote_user_ids = set(
            KeyFactorVote.objects.filter(created_at__gte=cutoff)
            .values_list("user_id", flat=True)
            .distinct()
        )

        active_user_ids = (
            forecast_user_ids
            | comment_user_ids
            | comment_vote_user_ids
            | key_factor_vote_user_ids
        )

        weekly_tag = MailingTags.WEEKLY_TOP_COMMENTS

        # 1) Unsubscribe all inactive users (ensure the tag is present)
        to_unsubscribe_qs = User.objects.exclude(id__in=active_user_ids).exclude(
            unsubscribed_mailing_tags__contains=[weekly_tag]
        )
        to_unsubscribe_qs.update(
            unsubscribed_mailing_tags=Func(
                F("unsubscribed_mailing_tags"),
                Value(weekly_tag),
                function="array_append",
            )
        )

        subscribed_users_count = User.objects.exclude(
            unsubscribed_mailing_tags__contains=[weekly_tag]
        ).count()

        unsubscribed_users_count = User.objects.filter(
            unsubscribed_mailing_tags__contains=[weekly_tag]
        ).count()

        self.stdout.write(
            self.style.SUCCESS(
                f"Active users: {len(active_user_ids)}. "
                f"Subscribed: {subscribed_users_count}. "
                f"Unsubscribed: {unsubscribed_users_count}."
            )
        )
