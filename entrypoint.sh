#!/bin/bash
set -e

# Wait for Postgres to be ready
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done
>&2 echo "Postgres is up - executing command"

# Run database migrations
poetry run python manage.py migrate

# Start services
poetry run python manage.py rundramatiq &
cd front_end && npm run dev &

# Start the main application
exec poetry run python manage.py runserver 0.0.0.0:8000
