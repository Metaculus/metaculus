#!/bin/bash
set -x
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/run_all_services.sh" &
SERVICE_PID=$!

cleanup() {
  exit_code=$?
  if [ -n "${SERVICE_PID:-}" ]; then
    kill $SERVICE_PID 2>/dev/null || true
    wait $SERVICE_PID 2>/dev/null || true
  fi
  exit $exit_code
}
trap cleanup EXIT

sleep 2
npx wait-on http://localhost:8000/api/healthcheck/ --timeout 30000
npx wait-on http://localhost:3000 --timeout 30000

poetry run pytest -s -p no:django -c - --noconftest --log-cli-level=INFO tests/integration/*.py | sed 's/^/[Tests] /'
