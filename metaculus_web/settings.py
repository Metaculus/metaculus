"""
Django settings for metaculus_web project.

Generated by 'django-admin startproject' using Django 5.0.6.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.0/ref/settings/
"""

import os
from pathlib import Path

import dj_database_url
import sentry_sdk
from sentry_sdk.integrations.dramatiq import DramatiqIntegration

import django.conf.locale

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Current env
ENV = os.environ.get("METACULUS_ENV", "").strip()
ENV_DEV = "dev"
ENV_PROD = "prod"
ENV_PLAY = "play"

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# TODO: change this in PROD!
SECRET_KEY = os.environ.get(
    "SECRET_KEY", "django-insecure-47@xwq5$pn*^d(2233!+41#=-)53&@iz)*t@foixp(ov2e7r)t"
)

DEBUG = os.environ.get("DEBUG", "False").lower() == "true"

# Application definition

INSTALLED_APPS = [
    # Django
    "misc",
    "modeltranslation",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party:
    "django_extensions",
    "rest_framework",
    "rest_framework.authtoken",
    "social_django",
    "rest_social_auth",
    "corsheaders",
    "anymail",
    "django_dramatiq",
    "admin_auto_filters",
    "django_better_admin_arrayfield",
    # TODO: disable in prod
    # first-party:
    "migrator",
    "authentication",
    "users",
    "posts",
    "questions",
    "projects",
    "scoring",
    "comments",
    "notifications",
    "fab_management",
    "fab_credits",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "utils.middlewares.LocaleOverrideMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "utils.middlewares.middleware_alpha_access_check",
]

if DEBUG:
    INSTALLED_APPS += ["debug_toolbar"]
    MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]

# Cors configuration
CORS_ORIGIN_WHITELIST = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]

ROOT_URLCONF = "metaculus_web.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "misc.context_processors.common_context",
            ],
        },
    },
]

WSGI_APPLICATION = "metaculus_web.wsgi.application"

# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    "default": {
        **dj_database_url.config(conn_max_age=600, default="postgres:///metaculus"),
    },
}

if ENV != "testing":
    # Old database for the migrator
    DATABASES["old"] = {
        **dj_database_url.config(
            env="OLD_DATABASE_URL",
            conn_max_age=600,
            default="postgres:///metaculus_old",
        ),
        # Should be readonly connection
        "OPTIONS": {"options": "-c default_transaction_read_only=on"},
    }

# TODO: probably we should switch to the explicit transactions
DATABASES["default"]["ATOMIC_REQUESTS"] = True

# REST Framework
# https://www.django-rest-framework.org/

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "EXCEPTION_HANDLER": "utils.exceptions.custom_exception_handler",
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.LimitOffsetPagination",
    "PAGE_SIZE": 20,
}

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Auth
AUTH_USER_MODEL = "users.User"
AUTHENTICATION_BACKENDS = (
    "django.contrib.auth.backends.ModelBackend",
    "authentication.backends.AuthLoginBackend",
    "social_core.backends.facebook.FacebookOAuth2",
    "social_core.backends.google.GoogleOAuth2",
)
# Should we verify email or always set `User.is_active = True`
AUTH_SIGNUP_VERIFY_EMAIL = os.environ.get("AUTH_SIGNUP_VERIFY_EMAIL", "True").lower() == "true"

if DEBUG:
    # Allow to authenticate without correst password in development
    AUTHENTICATION_BACKENDS += ("authentication.backends.PermissiveAuthLoginBackend",)

SOCIAL_AUTH_PIPELINE = (
    "social_core.pipeline.social_auth.social_details",
    "social_core.pipeline.social_auth.social_uid",
    "social_core.pipeline.social_auth.auth_allowed",
    "social_core.pipeline.social_auth.social_user",
    "social_core.pipeline.user.get_username",
    "social_core.pipeline.social_auth.associate_by_email",
    "social_core.pipeline.user.create_user",
    "social_core.pipeline.social_auth.associate_user",
    "social_core.pipeline.social_auth.load_extra_data",
    "social_core.pipeline.user.user_details",
)

SOCIAL_AUTH_FACEBOOK_KEY = os.environ.get("SOCIAL_AUTH_FACEBOOK_KEY")
SOCIAL_AUTH_FACEBOOK_SECRET = os.environ.get("SOCIAL_AUTH_FACEBOOK_SECRET")
SOCIAL_AUTH_FACEBOOK_SCOPE = ["email"]
SOCIAL_AUTH_FACEBOOK_PROFILE_EXTRA_PARAMS = {"fields": "id, name, email"}
# Google
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = os.environ.get("SOCIAL_AUTH_GOOGLE_OAUTH2_KEY")
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = os.environ.get("SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET")
REST_SOCIAL_VERBOSE_ERRORS = True

# Email configuration
# https://anymail.dev/
MAILGUN_API_KEY = os.environ.get("MAILGUN_API_KEY")
MAILGUN_SUBDOMAIN = os.environ.get("MAILGUN_SUBDOMAIN")
ANYMAIL = {
    "MAILGUN_API_KEY": MAILGUN_API_KEY,
    "SEND_DEFAULTS": {
        # https://anymail.dev/en/stable/sending/templates/#batch-sending-with-merge-data
        # "Without it, you may get a single message to everyone, exposing all of the email addresses
        # to all recipients. (If you don’t have any per-recipient customizations, but still want
        # individual messages, just set merge_data to an empty dict.)"
        "merge_data": {},
    },
}
EMAIL_BACKEND = "anymail.backends.mailgun.EmailBackend"
EMAIL_HOST_USER = os.environ.get(
    "EMAIL_HOST_USER", "Metaculus Accounts <accounts@mg2.metaculus.com>"
)
EMAIL_SENDER_NO_REPLY = os.environ.get(
    "EMAIL_SENDER_NO_REPLY", "Metaculus NoReply <no-reply@mg2.metaculus.com>"
)
EMAIL_FEEDBACK = os.environ.get("EMAIL_FEEDBACK", "feedback@metaculus.com")
# TODO: reconsider after release
EMAIL_ALLOW_SEND_TO_ALL_USERS = (
    os.environ.get("EMAIL_ALLOW_SEND_TO_ALL_USERS", "false").lower() == "true"
)

# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/

STATIC_URL = "static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_DIRS = [os.path.join(BASE_DIR, "docs")]

# Default primary key field type
# https://docs.djangoproject.com/en/5.0/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Frontend configuration
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:3000").rstrip(
    "/"
)

SEND_ALL_MAIL_TO = os.environ.get("SEND_ALL_MAIL_TO", None)
MAIL_FREQUENCY_MIN = int(os.environ.get("MAIL_FREQUENCY_MIN", 20))

if MAIL_FREQUENCY_MIN > 59:
    raise Exception(
        "MAIL_FREQUENCY_MIN must be between 1 and 59 (used in cron tab as 0-59/MAIL_FREQUENCY_MIN * * * *)"
    )

# Redis endpoint
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
# Extra redis config query
REDIS_URL_CONFIG = os.environ.get("REDIS_URL_CONFIG", "")

SCREENSHOT_SERVICE_API_KEY = os.environ.get("SCREENSHOT_SERVICE_API_KEY", "")
SCREENSHOT_SERVICE_API_URL = os.environ.get(
    "SCREENSHOT_SERVICE_API_URL", "https://screenshot.metaculus.com/api/screenshot"
)

# django-dramatiq
# https://github.com/Bogdanp/django_dramatiq
DRAMATIQ_BROKER = {
    "BROKER": "dramatiq.brokers.redis.RedisBroker",
    "OPTIONS": {
        # Setting redis db to 1 for the MQ storage
        "url": f"{REDIS_URL}/1?{REDIS_URL_CONFIG}",
    },
    "MIDDLEWARE": [
        "dramatiq.middleware.AgeLimit",
        "dramatiq.middleware.TimeLimit",
        "dramatiq.middleware.Callbacks",
        "dramatiq.middleware.Retries",
        "django_dramatiq.middleware.AdminMiddleware",
        "django_dramatiq.middleware.DbConnectionsMiddleware",
    ],
}
DRAMATIQ_RATE_LIMITER_BACKEND_OPTIONS = {
    # Setting redis db to 1 for the MQ storage
    "url": f"{REDIS_URL}/3?{REDIS_URL_CONFIG}",
}

# Setting StubBroker broker for unit tests environment
# Integration tests should run as the real env
if ENV == "testing":
    DRAMATIQ_BROKER.update(
        {"BROKER": "dramatiq.brokers.stub.StubBroker", "OPTIONS": {}}
    )
DRAMATIQ_AUTODISCOVER_MODULES = ["tasks", "jobs"]

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": f"{REDIS_URL}/2?{REDIS_URL_CONFIG}",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        },
    }
}

# Django-storages
# https://github.com/jschneier/django-storages
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {},
    },
    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage.CompressedManifestStaticFilesStorage"
            if not DEBUG
            else "django.contrib.staticfiles.storage.StaticFilesStorage"
        )
    },
}

ITN_DB_MACHINE_SSH_ADDR = os.environ.get("ITN_DB_MACHINE_SSH_ADDR")
ITN_DB_MACHINE_SSH_USER = os.environ.get("ITN_DB_MACHINE_SSH_USER")
ITN_DB_MACHINE_SSH_KEY = os.environ.get("ITN_DB_MACHINE_SSH_KEY")
ITN_DB_USER = os.environ.get("ITN_DB_USER")
ITN_DB_PASSWORD = os.environ.get("ITN_DB_PASSWORD")

AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_STORAGE_BUCKET_NAME")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME")
# Django-storages perform expensive operations of s3 objects signing if this setting is not defined.
# Ideally, we need to point our cloudflare subdomain to serve media instead of direct s3 access
AWS_S3_CUSTOM_DOMAIN = os.environ.get(
    "AWS_S3_CUSTOM_DOMAIN", f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
)
AWS_S3_FILE_OVERWRITE = False
AWS_QUERYSTRING_AUTH = False

# Cloudflare captcha
# https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
TURNSTILE_SECRET_KEY = os.environ.get("TURNSTILE_SECRET_KEY")

# Restricted DEV access
# If none -> not restricted
ALPHA_ACCESS_TOKEN = os.environ.get("ALPHA_ACCESS_TOKEN")

# OpenAI configuration
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Serper Google API key
SERPER_API_KEY = os.environ.get("SERPER_API_KEY")

GOOGLE_CREDEBTIALS_FAB_SHEET_B64 = os.environ.get("GOOGLE_CREDEBTIALS_FAB_SHEET_B64")

FAB_CREDITS_ANTHROPIC_API_KEY = os.environ.get("FAB_CREDITS_ANTHROPIC_API_KEY")
FAB_CREDITS_OPENAI_API_KEY = os.environ.get("FAB_CREDITS_OPENAI_API_KEY")

ALLOWED_HOSTS = [
    ".metaculus.com",
    "localhost",
    "127.0.0.1",
    "dev-metaculus-web-023b332df454.herokuapp.com/",  # remove after we have a DNS entry for dev environment
]

CSRF_TRUSTED_ORIGINS = [FRONTEND_BASE_URL]
INTERNAL_IPS = ["127.0.0.1"]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "console": {
            "format": "[\x1b[1m%(asctime)s %(levelname)s] %(name)s:\x1b[0m %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "console",
        },
    },
    "loggers": {
        "": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": ["console"],
        },
        "MARKDOWN": {
            "level": "INFO",
            "handlers": ["console"],
        },
        "dramatiq": {
            "level": "DEBUG",
            "handlers": ["console"],
        },
    },
}

SHELL_PLUS_IMPORTS = [
    "import numpy as np",
    "from datetime import datetime, timedelta, timezone as dt_timezone",
]


def traces_sampler(sampling_context):
    exclude_endpoints = [
        "/api/get-bulletins",
        "/api/auth/verify_token",
        "/api/auth/social",
    ]
    wsgi_environ = sampling_context.get("wsgi_environ", {})
    url = wsgi_environ.get("PATH_INFO")

    if url:
        for starts_with in exclude_endpoints:
            if url.startswith(starts_with):
                return 0

    return 1.0


if os.environ.get("SENTRY_DNS", None):
    sentry_sdk.init(
        dsn=os.environ.get("SENTRY_DNS"),
        traces_sampler=traces_sampler,
        profiles_sample_rate=1.0,
        environment=ENV,
        integrations=[
            DramatiqIntegration(),
        ],
    )


def gettext(s):
    return s


EXTRA_LANG_INFO = {
    "original": {
        "bidi": False,
        "code": "original",
        "name": "Original",
        "name_local": "Original",
    },
}
LANG_INFO = dict(django.conf.locale.LANG_INFO, **EXTRA_LANG_INFO)
django.conf.locale.LANG_INFO = LANG_INFO

LANGUAGES = (
    ("original", gettext("Original content")),
    ("en", gettext("English")),
    ("cs", gettext("Czech")),
    ("es", gettext("Spanish")),
    ("zh", gettext("Simplified Chinese")),
    ("pt", gettext("Portuguese")),
)

ORIGINAL_LANGUAGE_CODE = "original"
MODELTRANSLATION_DEFAULT_LANGUAGE = ORIGINAL_LANGUAGE_CODE
MODELTRANSLATION_FALLBACK_LANGUAGES = ("original", "en", "es")
USE_I18N = True

LOCALE_PATHS = (os.path.join(os.path.dirname(__file__), "locale"),)

GOOGLE_TRANSLATE_SERVICE_ACCOUNT_KEY = os.environ.get(
    "GOOGLE_TRANSLATE_SERVICE_ACCOUNT_KEY", None
)
