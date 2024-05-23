from migrator.utils import paginated_query


def migrate_users():
    for user in paginated_query("SELECT * FROM metac_account_user"):
        print(user)
