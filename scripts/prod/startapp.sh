#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------------------------------------------
# Wait for upstream services before starting Nginx
#
# Heroku considers a dyno "ready" as soon as any process binds to $PORT,
# so if Nginx starts first it will receive and proxy traffic before
# Gunicorn and Next.js are up, leading to 502/504 errors.
# This script ensures both the Python API (Gunicorn) and Next.js
# are listening before Nginx binds and begins accepting requests.
# -----------------------------------------------------------------------------

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
export UV_THREADPOOL_SIZE=2

(
  cd front_end &&
  npm run pm2-runtime \
  2>&1 | sed 's/^/[Frontend]: /'
) &

# 3) Wait for Gunicorn and Next.js before starting Nginx
# wait for Gunicorn socket to appear
timeout=15
echo "Waiting for Gunicorn socket…"
while [ $timeout -gt 0 ] && [ ! -S ./gunicorn.sock ]; do
  sleep 1
  timeout=$((timeout - 1))
done
if [ ! -S ./gunicorn.sock ]; then
  echo "Gunicorn socket never appeared; aborting."
  exit 1
fi

# wait for Next.js
timeout=15
echo "Waiting for Next.js on localhost:3000…"
while [ $timeout -gt 0 ] && ! nc -z localhost 3000; do
  sleep 1
  timeout=$((timeout - 1))
done
if ! nc -z localhost 3000; then
  echo "Next.js never started; aborting."
  exit 1
fi

echo "All upstreams are ready. Starting Nginx..."

# 4) Render Nginx config & launch it
PORT="${PORT:-8080}" \
APP_DOMAIN="${APP_DOMAIN:-}" \
envsubst '${PORT},${APP_DOMAIN}' \
  < /etc/nginx/http.d/app_nginx.template \
  > /etc/nginx/http.d/app_nginx.conf

# Cleanup default nginx configuration
rm -f /etc/nginx/http.d/default.conf

nginx &

# 5) If *any* child process exits, kill the rest and crash the dyno
wait -n
echo "[Supervisor]: one of the services has exited, shutting down"
exit 1
