#!/usr/bin/env bash
set -euo pipefail

# If this script gets SIGINT/TERM/EXIT, kill all its children too
trap 'pkill -P $$; exit' INT TERM EXIT

cd /app
source venv/bin/activate

# 1) Django API (Gunicorn)
(
  gunicorn metaculus_web.wsgi:application \
    --bind=unix:./gunicorn.sock \
    --workers $GUNICORN_WORKERS \
    --threads 2 \
    --timeout 25 \
    --keep-alive 5 \
    --access-logformat '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(M)s' \
    --access-logfile - \
    --error-logfile - \
  2>&1 | sed 's/^/[Backend]: /'
) &

# 2) Next.js Frontend
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=512"
export UV_THREADPOOL_SIZE=2

(
  cd front_end &&
  PORT=3000 pm2-runtime npm -- start \
  2>&1 | sed 's/^/[Frontend]: /'
) &

# 3) Render Nginx config & launch it
PORT="${PORT:-8080}" \
envsubst '${PORT}' \
  < /etc/nginx/http.d/app_nginx.template \
  > /etc/nginx/http.d/app_nginx.conf

# Cleanup default nginx configuration
rm -f /etc/nginx/http.d/default.conf

nginx &

# 4) If *any* child process exits, kill the rest and crash the dyno
wait -n
echo "[Supervisor]: one of the services has exited, shutting down"
exit 1
