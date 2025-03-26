from fab_credits.models import UserUsage

from ..utils import paginated_query, filter_for_existing_users


def migrate_fab_credits():
    entries = UserUsage.objects.bulk_create(
        [
            UserUsage(**usage)
            for usage in filter_for_existing_users(
                paginated_query("SELECT * FROM fab_credits_userusage")
            )
        ]
    )
    print(f"Migrated {len(entries)} Fab UserUsage entries")
