from .settings import *
import dj_database_url

DATABASES = {
    "default": {
        **dj_database_url.config(
            env="TEST_DATABASE_URL", conn_max_age=600, default="postgres:///metaculus"
        ),
    },
}

TEST = True
