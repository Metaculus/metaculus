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

# If this script gets SIGINT/TERM/EXIT, kill all processes in our process group
trap 'kill 0' INT TERM EXIT

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
GUNICORN_PID=$!

# 2) Next.js Frontend
export NODE_ENV=production
export UV_THREADPOOL_SIZE=2

(
  cd front_end &&
  npm run pm2-runtime \
  2>&1 | sed 's/^/[Frontend]: /'
) &
NEXTJS_PID=$!

# 3) Wait for both services IN PARALLEL
echo "Waiting for services to become ready..."

wait_for_gunicorn() {
  local timeout=15
  while [ $timeout -gt 0 ]; do
    [ -S ./gunicorn.sock ] && return 0
    sleep 1
    timeout=$((timeout - 1))
  done
  return 1
}

wait_for_nextjs() {
  local timeout=15
  while [ $timeout -gt 0 ]; do
    timeout 1 bash -c ">/dev/tcp/localhost/3000" 2>/dev/null && return 0
    sleep 1
    timeout=$((timeout - 1))
  done
  return 1
}

# Run both waits in parallel
wait_for_gunicorn &
WAIT_GU_PID=$!

wait_for_nextjs &
WAIT_NJ_PID=$!

# Check results
if ! wait $WAIT_GU_PID; then
  echo "Gunicorn socket never appeared; aborting."
  exit 1
fi

if ! wait $WAIT_NJ_PID; then
  echo "Next.js never started; aborting."
  exit 1
fi

# 4) Render Nginx config & launch
export PORT="${PORT:-8080}"
export APP_DOMAIN="${APP_DOMAIN:-}"
echo "Configuring Nginx to listen on port $PORT..."

envsubst '${PORT},${APP_DOMAIN}' \
  < /etc/nginx/http.d/app_nginx.template \
  > /etc/nginx/http.d/app_nginx.conf

# Debug: show listen directives
echo "Nginx listen config:"
grep -E "^\s*listen" /etc/nginx/http.d/app_nginx.conf || echo "No listen directives found!"

# Test nginx config
nginx -t 2>&1 || { echo "Nginx config test failed!"; exit 1; }

# Cleanup default nginx configuration
rm -f /etc/nginx/http.d/default.conf

echo "All upstreams are ready. Starting Nginx..."
nginx &
NGINX_PID=$!

# 5) Monitor services and report which one exits
echo "[Supervisor]: All services started (Gunicorn=$GUNICORN_PID, Next.js=$NEXTJS_PID, Nginx=$NGINX_PID)"

EXITED_PID=""
wait -n -p EXITED_PID $GUNICORN_PID $NEXTJS_PID $NGINX_PID || true

case "$EXITED_PID" in
  "$GUNICORN_PID") echo "[Supervisor]: Gunicorn exited" ;;
  "$NEXTJS_PID")   echo "[Supervisor]: Next.js exited" ;;
  "$NGINX_PID")    echo "[Supervisor]: Nginx exited" ;;
  *)               echo "[Supervisor]: Unknown process exited (PID: $EXITED_PID)" ;;
esac

exit 1
