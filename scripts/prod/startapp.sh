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

export NEXT_PUBLIC_APP_URL="http://localhost:$PORT"
export UV_THREADPOOL_SIZE=6
export NODE_OPTIONS="--max-old-space-size=2048"
(gunicorn metaculus_web.wsgi:application --bind 0.0.0.0:8000 --workers 4 --threads 8 --timeout 25 2>&1 | sed 's/^/[Backend]: /') &
(cd front_end && npm run start 2>&1 | sed 's/^/[Frontend]: /')
