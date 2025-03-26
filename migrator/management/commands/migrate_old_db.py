from datetime import datetime

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection
from django.utils import timezone

from migrator.services.migrate_comments import migrate_comments, migrate_comment_votes
from migrator.services.migrate_fab_credits import migrate_fab_credits
from migrator.services.migrate_forecasts import (
    migrate_forecasts,
    migrate_metaculus_predictions,
)
from migrator.services.migrate_leaderboards import (
    create_global_leaderboards,
    populate_global_leaderboards,
    populate_project_leaderboards,
)
from migrator.services.migrate_mailgun_notification_preferences import (
    migrate_mailgun_notification_preferences,
)
from migrator.services.migrate_permissions import migrate_permissions
from migrator.services.migrate_projects import migrate_projects, cleanup_unused_projects
from migrator.services.migrate_questions import migrate_questions
from migrator.services.migrate_scoring import migrate_archived_scores, score_questions
from migrator.services.migrate_subscriptions import migrate_subscriptions
from migrator.services.migrate_users import migrate_users
from migrator.services.migrate_votes import migrate_votes
from migrator.services.post_migrate import (
    post_migrate_calculate_divergence,
    post_migrate_update_post_fields, post_migrate_show_on_homepage,
)
from migrator.utils import reset_sequence
from posts.jobs import job_compute_movement
from posts.services.common import compute_hotness
from scoring.models import populate_medal_exclusion_records


def print_duration(text, task_start, global_start) -> datetime:
    print(
        "\033[K\033[92m"
        f"{text} ---"
        f"Task Duration:{str(timezone.now() - task_start).split('.')[0]}, "
        f"Total Runtime:{str(timezone.now() - global_start).split('.')[0]}"
        "\033[0m"
    )
    return timezone.now()


class Command(BaseCommand):
    help = """
    Migrates old database data to the new one
    """

    def add_arguments(self, parser):
        parser.add_argument(
            "site_ids",
            type=str,
            nargs="?",
            default="1",
            help="Comma-separated list of site IDs",
        )
        parser.add_argument(
            "start_score_questions_with_id",
            type=int,
            nargs="?",
            default=0,
            help="only score questions with IDs >= this",
        )

    def handle(self, *args, site_ids=None, **options):
        start = timezone.now()
        task_start = timezone.now()
        site_ids = [int(x) for x in site_ids.split(",")]
        with connection.cursor() as cursor:
            cursor.execute("DROP SCHEMA public CASCADE;")
            cursor.execute("CREATE SCHEMA public;")
        call_command("makemigrations")
        call_command("migrate")

        # main model migration
        migrate_users(site_ids=site_ids)
        task_start = print_duration("Migrated users", task_start, start)
        migrate_fab_credits()
        task_start = print_duration("Migrated fab credits", task_start, start)
        migrate_questions(site_ids=site_ids)
        task_start = print_duration("Migrated questions", task_start, start)
        migrate_projects(site_ids=site_ids)
        task_start = print_duration("Migrated projects", task_start, start)
        migrate_votes()
        task_start = print_duration("Migrated votes", task_start, start)
        migrate_comments()
        task_start = print_duration("Migrated comments", task_start, start)
        migrate_comment_votes()
        task_start = print_duration("Migrated comment votes", task_start, start)
        migrate_permissions(site_ids=site_ids)
        task_start = print_duration("Migrated permissions", task_start, start)
        migrate_forecasts()
        task_start = print_duration("Migrated forecasts", task_start, start)
        migrate_metaculus_predictions()
        task_start = print_duration("Migrated Metaculus predictions", task_start, start)
        migrate_mailgun_notification_preferences()
        task_start = print_duration(
            "Migrated user notification preferences", task_start, start
        )

        # print("\033[93mPost Subscriptions/Following migration is disabled!\033[0m")
        migrate_subscriptions(site_ids=site_ids)
        task_start = print_duration("Migrated post subscriptions", task_start, start)

        # scoring
        migrate_archived_scores()
        task_start = print_duration("Migrated archived scores", task_start, start)
        score_questions(start_id=options["start_score_questions_with_id"])
        task_start = print_duration("Scored questions", task_start, start)
        populate_medal_exclusion_records()
        task_start = print_duration(
            "Populated medal exclusion records", task_start, start
        )
        create_global_leaderboards()
        task_start = print_duration("Created global leaderboards", task_start, start)
        populate_global_leaderboards()
        task_start = print_duration("Populated global leaderboards", task_start, start)
        populate_project_leaderboards()
        task_start = print_duration("Populated project leaderboards", task_start, start)

        # Cleanup
        cleanup_unused_projects()

        # stats on questions
        post_migrate_calculate_divergence()
        task_start = print_duration("calculated divergence", task_start, start)
        job_compute_movement()
        task_start = print_duration("calculated movement", task_start, start)
        call_command("build_forecasts")
        task_start = print_duration("built forecasts", task_start, start)
        compute_hotness()
        task_start = print_duration("computed hotness", task_start, start)
        post_migrate_update_post_fields()
        post_migrate_show_on_homepage()
        print_duration("Updating other post fields", task_start, start)

        # Reset sql sequences
        reset_sequence()
