#! /bin/bash

cd /app/
uv run uvicorn app:app --host 0.0.0.0 --port $PORT --log-level info