#!/bin/bash
set -x
set -e
set -o pipefail

cleanup() {
    for process in "next-server" "gunicorn" "dramatiq"; do
        PID=$(ps aux | awk -v process=$process '$0 ~ process && $0 !~ /awk/ {print $2}')
        kill -s SIGTERM $PID || true
    done
}

trap cleanup EXIT
trap "exit 0" INT TERM
trap "exit 1" ERR

export DATABASE_URL=postgres://postgres:postgres@localhost:5432/test_metaculus

# Start the frontend and backend processes in the background,
# and use sed to add a prefix to each of their stdout and stderr printed lines
poetry run  ./manage.py collectstatic --noinput
(poetry run gunicorn metaculus_web.wsgi:application --log-level=debug --bind 0.0.0.0:8000 2>&1 | sed 's/^/[Backend]: /') &
(poetry run ./manage.py rundramatiq --processes 1 --threads 1 2>&1 | sed 's/^/[Dramatiq]: /') &
(npm run --prefix front_end start 2>&1 | sed 's/^/[Frontend]: /') &

wait