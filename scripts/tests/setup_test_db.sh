#!/bin/bash
set -euo pipefail

export DATABASE_URL="${1:-postgres://postgres:postgres@localhost:5432/test_metaculus}"
DB_NAME="${DATABASE_URL##*/}"
ADMIN_DB_URL="${DATABASE_URL%/*}/postgres"

rm -f test_metaculus.sql.zip
wget https://github.com/Metaculus/metaculus/releases/download/v0.0.1-alpha/test_metaculus.sql.zip -O test_metaculus.sql.zip
unzip test_metaculus.sql.zip

psql "$ADMIN_DB_URL" -c "DROP DATABASE IF EXISTS $DB_NAME;"
psql "$ADMIN_DB_URL" -c "CREATE DATABASE $DB_NAME;"
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS vector;"
pg_restore --dbname="$DATABASE_URL" \
  --clean \
  --no-privileges \
  --no-owner \
  --if-exists \
  --schema=public \
  test_metaculus.sql

poetry run ./manage.py migrate

# Make a binary question open for prediction so integration tests can use it
psql "$DATABASE_URL" <<'SQL'
WITH target AS (
    SELECT q.id AS question_id, p.id AS post_id
    FROM questions_question q
    JOIN posts_post p ON p.question_id = q.id
    WHERE q.type = 'binary'
      AND q.resolution IS NULL
    ORDER BY q.id
    LIMIT 1
),
update_question AS (
    UPDATE questions_question
    SET open_time = NOW() - INTERVAL '30 days',
        scheduled_close_time = NOW() + INTERVAL '365 days',
        scheduled_resolve_time = NOW() + INTERVAL '395 days',
        actual_close_time = NULL,
        actual_resolve_time = NULL,
        resolution = NULL
    FROM target
    WHERE questions_question.id = target.question_id
)
UPDATE posts_post
SET published_at = NOW() - INTERVAL '30 days',
    open_time = NOW() - INTERVAL '30 days'
FROM target
WHERE posts_post.id = target.post_id;
SQL