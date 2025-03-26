from django.utils import timezone
from migrator.utils import paginated_query, filter_for_existing_users
from rest_framework.authtoken.models import Token
from social_django.models import Association, Code, Nonce, Partial, UserSocialAuth
from users.models import User


def create_user(user_obj: dict) -> User:
    # TODO: ensure password hash is the same!
    # TODO: social auth data should be in a separate tables as is, not in the one columns as proposed
    user = User(
        # Let's keep same user id for convenience
        id=user_obj["id"],
        username=user_obj["username"],
        # Lowercase email just in case
        email=user_obj["email"].lower(),
        password=user_obj["password"],
        first_name="",
        last_name="",
        # Profile Data
        bio=user_obj.get("bio_text", ""),
        website=user_obj.get("website", ""),
        # Meta info
        last_login=user_obj["last_login"],
        date_joined=user_obj["date_joined"],
        created_at=user_obj["created_at"],
        edited_at=user_obj["edited_at"],
        # Permissions
        is_active=user_obj["is_active"],
        is_staff=user_obj["metaculus_staff"],
        is_superuser=user_obj["is_superuser"],
        is_bot=user_obj["forecaster_type"] == "BOT",
    )

    return user


def migrate_social_auth():
    UserSocialAuth.objects.bulk_create(
        [
            UserSocialAuth(**obj)
            for obj in filter_for_existing_users(
                paginated_query(f"SELECT * FROM social_auth_usersocialauth")
            )
        ]
    )

    print("Migrated DjangoSocial tables")


def migrate_users(site_ids: list = None):
    allowed_users = None

    if site_ids:
        allowed_users = list(
            paginated_query(
                "SELECT user_id FROM metac_account_usersitedata " "WHERE site_id in %s",
                [tuple(site_ids)],
                only_columns="user_id",
                flat=True,
            )
        )

    start = timezone.now()
    users = []
    for i, user_obj in enumerate(
        paginated_query(
            "SELECT u.*, p.bio_text, p.website "
            "FROM metac_account_user u "
            "LEFT JOIN metac_account_userprofile p ON p.user_id = u.id"
        ),
        1,
    ):
        if allowed_users is not None and user_obj["id"] not in allowed_users:
            continue

        print(
            f"\033[Kmigrating users: {i}. "
            f"dur:{str(timezone.now() - start).split('.')[0]} ",
            end="\r",
        )
        users.append(create_user(user_obj))

    print(
        f"\033[Kmigrated users: {i}. "
        f"dur:{str(timezone.now() - start).split(".")[0]}. "
        "bulk creating...",
        end="\r",
    )
    User.objects.bulk_create(users, batch_size=10_000)
    print(
        f"\033[Kmigrated users: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} "
        "bulk creating... DONE"
    )

    # Migrating existing bot/user tokens
    start = timezone.now()
    tokens = []
    for i, token_obj in enumerate(paginated_query("SELECT * FROM authtoken_token"), 1):
        if allowed_users is not None and token_obj["user_id"] not in allowed_users:
            continue

        tokens.append(Token(**token_obj))
        print(
            f"\033[Kmigrating tokens: {i}. "
            f"dur:{str(timezone.now() - start).split('.')[0]} ",
            end="\r",
        )
    print(
        f"\033[Kmigrating tokens: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} "
        "bulk creating...",
        end="\r",
    )
    Token.objects.bulk_create(tokens, batch_size=5_000)
    print(
        f"\033[Kmigrating tokens: {i}. "
        f"dur:{str(timezone.now() - start).split('.')[0]} "
        "bulk creating... DONE"
    )

    # Social migrations
    migrate_social_auth()
