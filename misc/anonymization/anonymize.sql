-- Anonymizes a copy of the production database for non-production use
-- (preview environments, local development). Never run it against production.
--
-- Safe to run more than once: each statement skips rows that are already
-- anonymized, so a second run changes nothing.
--
-- Run with:
--   python manage.py anonymize_users
-- or:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f misc/anonymization/anonymize.sql
--
-- misc/anonymization/manifest.py classifies every text column, and
-- tests/unit/test_misc/test_anonymization.py fails when a model gains one
-- that isn't classified there.

-- Credentials, sessions, queued emails (django_dramatiq_task stores each
-- message with its recipients and body), the admin audit log and the
-- pre-edit text of comments.
DELETE FROM authentication_apikey;
DELETE FROM comments_commentdiff;
DELETE FROM django_admin_log;
DELETE FROM django_dramatiq_task;
DELETE FROM django_session;
DELETE FROM social_auth_association;
DELETE FROM social_auth_code;
DELETE FROM social_auth_nonce;
DELETE FROM social_auth_partial;
DELETE FROM social_auth_usersocialauth;

-- Staff keep their real email addresses, so unsubscribe them from every
-- mailing tag (notifications.constants.MailingTags).
WITH tags (all_tags) AS (
    SELECT ARRAY[
        'weekly_top_comments',
        'comment_mentions',
        'question_resolution',
        'tournament_new_questions',
        'cp_change',
        'before_prediction_auto_withdrawal'
    ]::varchar[]
)
UPDATE users_user
SET unsubscribed_mailing_tags = tags.all_tags
FROM tags
WHERE users_user.is_staff
  AND NOT (users_user.unsubscribed_mailing_tags @> tags.all_tags);

-- Staff included: real hashes can be cracked offline.
-- A "!" prefix makes Django treat the password as unusable.
UPDATE users_user
SET password = '!' || md5(random()::text),
    last_login = NULL
WHERE password NOT LIKE '!%'
   OR last_login IS NOT NULL;

UPDATE users_user
SET email = 'email_' || id::text || '@notreal.local',
    first_name = 'firstname_' || id::text,
    last_name = 'lastname_' || id::text,
    bio = 'bio_' || id::text,
    website = NULL,
    twitter = NULL,
    linkedin = NULL,
    facebook = NULL,
    github = NULL,
    good_judgement_open = NULL,
    kalshi = NULL,
    manifold = NULL,
    infer = NULL,
    hypermind = NULL,
    occupation = NULL,
    location = NULL,
    profile_picture = NULL,
    old_usernames = '[]'::jsonb
WHERE NOT is_staff
  AND (
      email, first_name, last_name, bio,
      website, twitter, linkedin, facebook, github,
      good_judgement_open, kalshi, manifold, infer, hypermind,
      occupation, location, profile_picture, old_usernames
  ) IS DISTINCT FROM (
      'email_' || id::text || '@notreal.local',
      'firstname_' || id::text,
      'lastname_' || id::text,
      'bio_' || id::text,
      NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, NULL, NULL,
      NULL, NULL, NULL, '[]'::jsonb
  );

-- Campaign sign-up forms collect full name, country, institution, major and
-- graduation year. Keep only the flags, and drop any key a future form adds.
UPDATE users_usercampaignregistration AS registration
SET details = cleaned.details
FROM (
    SELECT r.id,
           CASE
               WHEN jsonb_typeof(r.details) = 'object' THEN jsonb_strip_nulls(
                   jsonb_build_object(
                       'undergrad', r.details -> 'undergrad',
                       'accepted_terms', r.details -> 'accepted_terms'
                   )
               )
               ELSE '{}'::jsonb
           END AS details
    FROM users_usercampaignregistration AS r
    JOIN users_user AS u ON u.id = r.user_id
    WHERE NOT u.is_staff
) AS cleaned
WHERE cleaned.id = registration.id
  AND registration.details IS DISTINCT FROM cleaned.details;

-- Private comments are personal notes, and soft-deleted comments were
-- removed by their authors. Clear every language column of both, plus the
-- key factors written on them. Key factors on news articles are kept.
-- Clearing is_text_archived stops the app from reading the original text of
-- archived (bot) comments back from the S3 archive.
UPDATE comments_keyfactordriver AS driver
SET text = '',
    text_original = '',
    text_en = NULL,
    text_cs = NULL,
    text_es = NULL,
    text_zh = NULL,
    "text_zh_TW" = NULL,
    text_pt = NULL,
    content_last_md5 = NULL
FROM comments_keyfactor AS key_factor
JOIN comments_comment AS parent_comment ON parent_comment.id = key_factor.comment_id
WHERE key_factor.driver_id = driver.id
  AND (parent_comment.is_private OR parent_comment.is_soft_deleted)
  AND (
      driver.text, driver.text_original, driver.text_en, driver.text_cs,
      driver.text_es, driver.text_zh, driver."text_zh_TW", driver.text_pt,
      driver.content_last_md5
  ) IS DISTINCT FROM ('', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

UPDATE comments_keyfactorbaserate AS base_rate
SET reference_class = '',
    based_on = '',
    source = '',
    content_last_md5 = NULL
FROM comments_keyfactor AS key_factor
JOIN comments_comment AS parent_comment ON parent_comment.id = key_factor.comment_id
WHERE key_factor.base_rate_id = base_rate.id
  AND (parent_comment.is_private OR parent_comment.is_soft_deleted)
  AND (
      base_rate.reference_class, base_rate.based_on, base_rate.source,
      base_rate.content_last_md5
  ) IS DISTINCT FROM ('', '', '', NULL);

UPDATE comments_comment
SET text = '',
    text_original = '',
    text_en = NULL,
    text_cs = NULL,
    text_es = NULL,
    text_zh = NULL,
    "text_zh_TW" = NULL,
    text_pt = NULL,
    content_last_md5 = NULL,
    text_original_search_vector = NULL,
    is_text_archived = FALSE
WHERE (is_private OR is_soft_deleted)
  AND (
      (
          text, text_original, text_en, text_cs, text_es, text_zh,
          "text_zh_TW", text_pt, content_last_md5
      ) IS DISTINCT FROM ('', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL)
      OR text_original_search_vector IS NOT NULL
      OR is_text_archived
  );

-- edit_history holds ids of the comments_commentdiff rows deleted above.
UPDATE comments_comment
SET edit_history = '[]'::jsonb
WHERE edit_history <> '[]'::jsonb;

UPDATE posts_postusersnapshot
SET private_note = '',
    private_note_updated_at = NULL
WHERE private_note <> ''
   OR private_note_updated_at IS NOT NULL;

-- Free-text notes about individual users.
UPDATE scoring_medalexclusionrecord
SET notes = NULL
WHERE notes IS NOT NULL;

UPDATE misc_userdataaccess
SET notes = NULL
WHERE notes IS NOT NULL;

UPDATE users_userspamactivity
SET text = '',
    reason = ''
WHERE text <> ''
   OR reason <> '';

-- Mark pending emails as sent so a non-production worker doesn't send the
-- backlog to the real staff addresses kept above.
UPDATE notifications_notification
SET email_sent = TRUE
WHERE NOT email_sent;

UPDATE questions_userforecastnotification
SET email_sent = TRUE
WHERE NOT email_sent;

UPDATE comments_commentsoftheweeknotification
SET email_sent = TRUE
WHERE NOT email_sent;
