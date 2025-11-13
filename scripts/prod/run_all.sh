#!/bin/bash
set -e
set -o pipefail

cleanup() {
    echo "Stopping the processes"
    for process in "gunicorn node manage.py"; do
        echo "Stopping $process"
        PID=$(ps -eo pid,comm,args | awk -v process=$process '$0 ~ process && $0 !~ /awk/ {print $1}')
        [ -n "$PID" ] && kill -s SIGTERM $PID
    done
}

trap cleanup EXIT
trap "exit" INT TERM ERR

cd /app/
source venv/bin/activate
DRAMATIQ_PROCESSES="${DRAMATIQ_PROCESSES:-8}"
DRAMATIQ_THREADS="${DRAMATIQ_THREADS:-16}"

# Propagate nginx port and app domain
PORT="${PORT:-8080}" \
APP_DOMAIN="${APP_DOMAIN:-}" \
    envsubst '${PORT},${APP_DOMAIN}' </etc/nginx/http.d/app_nginx.template >/etc/nginx/http.d/app_nginx.conf
rm -f /etc/nginx/http.d/default.conf

export UV_THREADPOOL_SIZE=6
export NODE_OPTIONS="--max-old-space-size=2048"
(gunicorn metaculus_web.wsgi:application --bind=unix:./gunicorn.sock --access-logformat '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(M)s' --access-logfile - --workers $GUNICORN_WORKERS --threads 4 --timeout 25 2>&1 | sed 's/^/[Backend]: /') &
(python3 manage.py cron 2>&1 | sed 's/^/[Cronjob]: /') &
(python3 manage.py rundramatiq --processes $DRAMATIQ_PROCESSES --threads $DRAMATIQ_THREADS 2>&1 | sed 's/^/[Dramatiq]: /') &
(cd front_end && PORT=3000 pm2-runtime npm -- start 2>&1 | sed 's/^/[Frontend]: /') &
# Starting nginx
nginx
