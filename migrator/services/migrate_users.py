from social_django.models import Association, Code, Nonce, Partial, UserSocialAuth
from rest_framework.authtoken.models import Token

from migrator.utils import paginated_query
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
    social_auth_models = [UserSocialAuth, Partial, Nonce, Code, Association]

    for model in social_auth_models:
        model.objects.bulk_create(
            [
                model(**data)
                for data in paginated_query(f"SELECT * FROM {model._meta.db_table}")
            ]
        )

    print("Migrated DjangoSocial tables")


def migrate_users():
    users = []
    for user_obj in paginated_query(
        "SELECT u.*, p.bio_text, p.website "
        "FROM metac_account_user u "
        "LEFT JOIN metac_account_userprofile p ON p.user_id = u.id"
    ):
        users.append(create_user(user_obj))

    User.objects.bulk_create(users, batch_size=10_000)

    # Migrating existing bot/user tokens
    tokens = [
        Token(**token_obj)
        for token_obj in paginated_query("SELECT * FROM authtoken_token")
    ]
    Token.objects.bulk_create(tokens, batch_size=5_000)

    # Social migrations
    migrate_social_auth()
