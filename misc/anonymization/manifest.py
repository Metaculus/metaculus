"""
Classifies every column that can hold personal data, so anonymize.sql can't
silently fall behind the models. tests/unit/test_misc/test_anonymization.py
fails when a model column isn't classified here, or when an entry goes stale.

- WIPED_TABLES: anonymize.sql deletes every row of these tables.
- COLUMNS[table][column]:
    KEEP:  copied as is (public content, configuration, nothing personal).
    SCRUB: anonymize.sql rewrites it, for some or all rows.

Only text-like columns are listed (char, text, JSON, binary, file, array of
text, search and embedding vectors), and not those restricted to choices.
Translation columns (text_en, "text_zh_TW", ...) follow their base column.
"""

KEEP = "keep"
SCRUB = "scrub"

WIPED_TABLES = frozenset(
    {
        "authentication_apikey",
        "comments_commentdiff",
        "django_admin_log",
        "django_dramatiq_task",
        "django_session",
        "social_auth_association",
        "social_auth_code",
        "social_auth_nonce",
        "social_auth_partial",
        "social_auth_usersocialauth",
    }
)

COLUMNS: dict[str, dict[str, str]] = {
    "auth_group": {"name": KEEP},
    "auth_permission": {"codename": KEEP, "name": KEEP},
    "comments_comment": {
        "content_last_md5": SCRUB,
        "content_original_lang": KEEP,
        "edit_history": SCRUB,
        "text": SCRUB,
        "text_original_search_vector": SCRUB,
    },
    "comments_keyfactor": {"question_option": KEEP},
    "comments_keyfactorbaserate": {
        "based_on": SCRUB,
        "content_last_md5": SCRUB,
        "content_original_lang": KEEP,
        "reference_class": SCRUB,
        "source": SCRUB,
        "unit": KEEP,
    },
    "comments_keyfactordriver": {
        "content_last_md5": SCRUB,
        "content_original_lang": KEEP,
        "text": SCRUB,
    },
    "comments_keyfactornews": {
        "img_url": KEEP,
        "source": KEEP,
        "title": KEEP,
        "url": KEEP,
    },
    "django_content_type": {"app_label": KEEP, "model": KEEP},
    "misc_adtile": {
        "cta_text": KEEP,
        "description": KEEP,
        "image": KEEP,
        "title": KEEP,
        "url": KEEP,
    },
    "misc_bulletin": {"text": KEEP},
    "misc_itnarticle": {
        "embedding_vector": KEEP,
        "favicon_url": KEEP,
        "img_url": KEEP,
        "media_label": KEEP,
        "media_name": KEEP,
        "text": KEEP,
        "title": KEEP,
        "url": KEEP,
    },
    "misc_sidebaritem": {"emoji": KEEP, "name": KEEP, "url": KEEP},
    "misc_userdataaccess": {"notes": SCRUB},
    "notifications_notification": {"params": KEEP, "type": KEEP},
    "posts_notebook": {
        "content_last_md5": KEEP,
        "content_original_lang": KEEP,
        "feed_tile_summary": KEEP,
        "image_url": KEEP,
        "markdown": KEEP,
    },
    "posts_post": {
        "content_last_md5": KEEP,
        "content_original_lang": KEEP,
        "embedding_vector": KEEP,
        "html_metadata_json": KEEP,
        "short_title": KEEP,
        "title": KEEP,
    },
    "posts_postusersnapshot": {"private_note": SCRUB},
    "projects_project": {
        "content_last_md5": KEEP,
        "content_original_lang": KEEP,
        "description": KEEP,
        "emoji": KEEP,
        "header_image": KEEP,
        "header_logo": KEEP,
        "html_metadata_json": KEEP,
        "name": KEEP,
        "sign_up_fields": KEEP,
        "slug": KEEP,
        "subtitle": KEEP,
    },
    "projects_projectindex": {"max_label": KEEP, "min_label": KEEP},
    "questions_forecast": {"distribution_input": KEEP},
    "questions_groupofquestions": {
        "content_last_md5": KEEP,
        "content_original_lang": KEEP,
        "description": KEEP,
        "fine_print": KEEP,
        "group_variable": KEEP,
        "resolution_criteria": KEEP,
    },
    "questions_question": {
        "content_last_md5": KEEP,
        "content_original_lang": KEEP,
        "description": KEEP,
        "fine_print": KEEP,
        "group_variable": KEEP,
        "label": KEEP,
        "options": KEEP,
        "options_history": KEEP,
        "possibilities": KEEP,
        "resolution": KEEP,
        "resolution_criteria": KEEP,
        "title": KEEP,
        "unit": KEEP,
    },
    "scoring_leaderboard": {"display_config": KEEP, "name": KEEP},
    "scoring_medalexclusionrecord": {"notes": SCRUB},
    "users_user": {
        "bio": SCRUB,
        "email": SCRUB,
        "facebook": SCRUB,
        "first_name": SCRUB,
        "github": SCRUB,
        "good_judgement_open": SCRUB,
        "hypermind": SCRUB,
        "infer": SCRUB,
        "kalshi": SCRUB,
        "last_name": SCRUB,
        "linkedin": SCRUB,
        "location": SCRUB,
        "manifold": SCRUB,
        "metadata": KEEP,
        "occupation": SCRUB,
        "old_usernames": SCRUB,
        "password": SCRUB,
        "profile_picture": SCRUB,
        "twitter": SCRUB,
        "unsubscribed_mailing_tags": SCRUB,
        "username": KEEP,
        "website": SCRUB,
    },
    "users_usercampaignregistration": {"details": SCRUB, "key": KEEP},
    "users_userspamactivity": {"reason": SCRUB, "text": SCRUB},
}
