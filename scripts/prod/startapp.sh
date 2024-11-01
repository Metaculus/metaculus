#!/bin/bash
set -e
set -o pipefail

cleanup() {
    echo "Stopping the processes"
    for process in "gunicorn"; do
        PID=$(ps -eo pid,comm,args | awk -v process=$process '$0 ~ process && $0 !~ /awk/ {print $1}')
        [ -n "$PID" ] && kill -s SIGTERM $PID
    done
}

trap cleanup EXIT
trap "exit" INT TERM ERR

cd /app/
source venv/bin/activate

# Propagate nginx port
PORT="${PORT:-8080}" \
envsubst '${PORT}' < /etc/nginx/http.d/app_nginx.template > /etc/nginx/http.d/app_nginx.conf
rm /etc/nginx/http.d/default.conf

export UV_THREADPOOL_SIZE=6
export NODE_OPTIONS="--max-old-space-size=2048"
(gunicorn metaculus_web.wsgi:application --bind=unix:./gunicorn.sock --access-logfile - --workers $GUNICORN_WORKERS --threads 4 --timeout 25 2>&1 | sed 's/^/[Backend]: /') &
(cd front_end && PORT=3000 pm2-runtime npm -- start 2>&1 | sed 's/^/[Frontend]: /') &
# Starting nginx
nginx
