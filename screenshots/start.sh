#! /bin/bash

cd /app/
source venv/bin/activate
poetry run uvicorn app:app --host 0.0.0.0 --port $PORT --log-level info