"""
Classifies every column that can hold personal data, so anonymize.sql can't
silently fall behind the models. tests/unit/test_misc/test_anonymization.py
fails when a model column isn't classified here, or when an entry goes stale.

- WIPED_TABLES: anonymize.sql deletes every row of these tables.
- COLUMNS[table][column]:
    KEEP:  copied as is (public content, configuration, nothing personal).
    SCRUB: anonymize.sql rewrites it, for some or all rows.

Only text-like columns are listed: char (choices included), text, JSON,
binary, file, UUID, arrays of those, and search and embedding vectors.
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
    "auth_group": {
        "name": KEEP,
    },
    "auth_permission": {
        "codename": KEEP,
        "name": KEEP,
    },
    "coherence_aggregatecoherencelink": {
        "type": KEEP,
    },
    "coherence_coherencelink": {
        "type": KEEP,
    },
    "comments_comment": {
        "content_last_md5": SCRUB,
        "content_original_lang": KEEP,
        "edit_history": SCRUB,
        "text": SCRUB,
        "text_original_search_vector": SCRUB,
    },
    "comments_keyfactor": {
        "question_option": KEEP,
    },
    "comments_keyfactorbaserate": {
        "based_on": SCRUB,
        "content_last_md5": SCRUB,
        "content_original_lang": KEEP,
        "extrapolation": KEEP,
        "reference_class": SCRUB,
        "source": SCRUB,
        "type": KEEP,
        "unit": SCRUB,
    },
    "comments_keyfactordriver": {
        "content_last_md5": SCRUB,
        "content_original_lang": KEEP,
        "text": SCRUB,
    },
    "comments_keyfactornews": {
        "img_url": SCRUB,
        "source": SCRUB,
        "title": SCRUB,
        "url": SCRUB,
    },
    "comments_keyfactorvote": {
        "vote_reason": KEEP,
        "vote_type": KEEP,
    },
    "django_content_type": {
        "app_label": KEEP,
        "model": KEEP,
    },
    "misc_adtile": {
        "cta_text": KEEP,
        "description": KEEP,
        "image": KEEP,
        "placements": KEEP,
        "title": KEEP,
        "url": KEEP,
    },
    "misc_bulletin": {
        "text": KEEP,
    },
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
    "misc_sidebaritem": {
        "emoji": KEEP,
        "name": KEEP,
        "section": KEEP,
        "url": KEEP,
    },
    "misc_userdataaccess": {
        "api_access_tier": KEEP,
        "notes": SCRUB,
    },
    "notifications_notification": {
        "params": KEEP,
        "type": KEEP,
    },
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
        "curation_status": KEEP,
        "embedding_vector": KEEP,
        "html_metadata_json": KEEP,
        "short_title": KEEP,
        "title": KEEP,
    },
    "posts_postsubscription": {
        "type": KEEP,
    },
    "posts_postusersnapshot": {
        "private_note": SCRUB,
    },
    "projects_project": {
        "bot_leaderboard_status": KEEP,
        "content_last_md5": KEEP,
        "content_original_lang": KEEP,
        "default_permission": KEEP,
        "description": KEEP,
        "emoji": KEEP,
        "header_image": KEEP,
        "header_logo": KEEP,
        "html_metadata_json": KEEP,
        "name": KEEP,
        "sign_up_fields": KEEP,
        "slug": KEEP,
        "subtitle": KEEP,
        "type": KEEP,
        "visibility": KEEP,
    },
    "projects_projectindex": {
        "max_label": KEEP,
        "min_label": KEEP,
        "type": KEEP,
    },
    "projects_projectuserpermission": {
        "permission": KEEP,
    },
    "questions_aggregateforecast": {
        "method": KEEP,
    },
    "questions_forecast": {
        "distribution_input": KEEP,
        "source": KEEP,
    },
    "questions_groupofquestions": {
        "content_last_md5": KEEP,
        "content_original_lang": KEEP,
        "description": KEEP,
        "fine_print": KEEP,
        "graph_type": KEEP,
        "group_variable": KEEP,
        "resolution_criteria": KEEP,
        "subquestions_order": KEEP,
    },
    "questions_question": {
        "content_last_md5": KEEP,
        "content_original_lang": KEEP,
        "default_aggregation_method": KEEP,
        "default_score_type": KEEP,
        "description": KEEP,
        "fine_print": KEEP,
        "group_variable": KEEP,
        "label": KEEP,
        "options": KEEP,
        "options_history": KEEP,
        "options_order": KEEP,
        "possibilities": KEEP,
        "resolution": KEEP,
        "resolution_criteria": KEEP,
        "title": KEEP,
        "type": KEEP,
        "unit": KEEP,
    },
    "scoring_archivedscore": {
        "aggregation_method": KEEP,
        "score_type": KEEP,
    },
    "scoring_leaderboard": {
        "bot_status": KEEP,
        "display_config": KEEP,
        "name": KEEP,
        "score_type": KEEP,
    },
    "scoring_leaderboardentry": {
        "aggregation_method": KEEP,
        "medal": KEEP,
    },
    "scoring_leaderboardsranksentry": {
        "rank_type": KEEP,
    },
    "scoring_medalexclusionrecord": {
        "exclusion_type": KEEP,
        "notes": SCRUB,
    },
    "scoring_reputation": {
        "type": KEEP,
    },
    "scoring_score": {
        "aggregation_method": KEEP,
        "score_type": KEEP,
    },
    "users_user": {
        "api_access_tier": KEEP,
        "api_forecasting_access": KEEP,
        "app_theme": KEEP,
        "bio": SCRUB,
        "email": SCRUB,
        "facebook": SCRUB,
        "first_name": SCRUB,
        "github": SCRUB,
        "good_judgement_open": SCRUB,
        "hypermind": SCRUB,
        "infer": SCRUB,
        "interface_type": KEEP,
        "kalshi": SCRUB,
        "language": KEEP,
        "last_name": SCRUB,
        "linkedin": SCRUB,
        "location": SCRUB,
        "manifold": SCRUB,
        "metadata": SCRUB,
        "occupation": SCRUB,
        "old_usernames": SCRUB,
        "password": SCRUB,
        "profile_picture": SCRUB,
        "twitter": SCRUB,
        "unsubscribed_mailing_tags": SCRUB,
        "username": KEEP,
        "website": SCRUB,
    },
    "users_usercampaignregistration": {
        "details": SCRUB,
        "key": KEEP,
    },
    "users_userspamactivity": {
        "content_type": KEEP,
        "reason": SCRUB,
        "text": SCRUB,
    },
}
