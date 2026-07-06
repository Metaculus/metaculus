from django.core.management.base import BaseCommand
from django.db.models import F, Value, CharField, TextField
from django.db.models.functions import Concat
from social_django.models import Partial, UserSocialAuth

from notifications.constants import MailingTags
from users.models import User


def anonymize_users(users):
    total_users = users.count()
    batch_size = 20000

    # Process users in batches using direct DB operations
    for batch_start in range(0, total_users, batch_size):
        # Use filter with id__in instead of slicing
        batch_ids = users.order_by("id").values_list("id", flat=True)[
            batch_start : batch_start + batch_size
        ]
        batch = users.filter(id__in=list(batch_ids))

        # Update the batch with a single query
        batch.update(
            email=Concat(
                Value("email_"),
                F("id"),
                Value("@notreal.local"),
                output_field=CharField(),
            ),
            first_name=Concat(Value("firstname_"), F("id"), output_field=CharField()),
            last_name=Concat(Value("lastname_"), F("id"), output_field=CharField()),
            bio=Concat(Value("bio_"), F("id"), output_field=TextField()),
            # Set all social fields to NULL
            website=None,
            twitter=None,
            linkedin=None,
            facebook=None,
            github=None,
            good_judgement_open=None,
            kalshi=None,
            manifold=None,
            infer=None,
            hypermind=None,
            occupation=None,
            location=None,
            profile_picture=None,
            old_usernames=[],
        )

        processed = batch_start + batch.count()
        print(f"Processed {processed} out of {total_users} users")


class Command(BaseCommand):
    help = "Anonymises users data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Skip confirmation prompt and proceed with anonymization",
        )

    def handle(self, *args, **kwargs):
        users = User.objects.exclude(is_staff=True)
        staff_users = User.objects.filter(is_staff=True)
        total_users = users.count()

        if not kwargs["force"]:
            confirm = input(
                f"\nWARNING: This will anonymize data for {total_users} users.\n"
                "This action cannot be undone.\n"
                "Are you sure you want to continue? [y/N]: "
            )
            if confirm.lower() != "y":
                self.stdout.write(self.style.WARNING("Operation cancelled."))
                return

        for staff_user in staff_users:
            staff_user.unsubscribed_mailing_tags = [c[0] for c in MailingTags.choices]
            staff_user.save()

        print(
            f" Unsubscribed {staff_users.count()} staff users from mailing tags ",
            staff_users.first().unsubscribed_mailing_tags,
        )

        # Clear social auth tables
        partial_count, _ = Partial.objects.all().delete()
        print(f"Deleted {partial_count} entries from social_auth_partial")

        social_auth_count, _ = UserSocialAuth.objects.all().delete()
        print(f"Deleted {social_auth_count} entries from social_auth_usersocialauth")

        anonymize_users(users)
        self.stdout.write(self.style.SUCCESS("Successfully anonymized all users."))
