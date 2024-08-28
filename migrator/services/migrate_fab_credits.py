from ..utils import paginated_query

from fab_credits.models import UserUsage


def migrate_fab_credits():
    entries = UserUsage.objects.bulk_create(
        [
            UserUsage(**usage)
            for usage in paginated_query("SELECT * FROM fab_credits_userusage")
        ]
    )
    print(f"Migrated {len(entries)} Fab UserUsage entries")
