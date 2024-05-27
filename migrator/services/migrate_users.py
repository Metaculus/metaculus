from migrator.utils import paginated_query, one2one_query
from users.models import User


def create_user(user_obj: dict, profile_obj: dict | None) -> User:
    # TODO: ensure password hash is the same!
    # TODO: ensure we reset psql PK inc counter
    # TODO: social auth data should be in a separate tables as is, not in the one columns as proposed
    profile_obj = profile_obj or {}

    user = User(
        # Let's keep same user id for convenience
        id=user_obj["id"],
        username=user_obj["username"],
        # Lowercase email just in case
        email=user_obj["email"].lower(),
        password=user_obj["password"],
        first_name=user_obj["first_name"],
        last_name=user_obj["last_name"],
        # Profile Data
        bio=profile_obj.get("bio_text"),
        website=profile_obj.get("website"),
        # Meta info
        last_login=user_obj["last_login"],
        date_joined=user_obj["date_joined"],
        created_at=user_obj["created_at"],
        edited_at=user_obj["edited_at"],
        # Permissions
        is_active=user_obj["is_active"],
        is_staff=user_obj["metaculus_staff"],
        is_superuser=user_obj["is_superuser"],
    )

    return user


def migrate_users():
    users = []
    for user_obj in paginated_query("SELECT * FROM metac_account_user"):
        user_id = user_obj["id"]

        profile_obj = one2one_query(
            "SELECT * FROM metac_account_userprofile WHERE user_id = %s", [user_id]
        )

        users.append(create_user(user_obj, profile_obj))
        # TODO: bulk? Probably not suitable since users will produce a lot of nested migrations
    User.objects.bulk_create(users)
