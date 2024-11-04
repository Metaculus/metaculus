#! /bin/bash

cd /app/
source venv/bin/activate

DRAMATIQ_PROCESSES="${DRAMATIQ_PROCESSES:-8}"
DRAMATIQ_THREADS="${DRAMATIQ_THREADS:-16}"

python3 manage.py rundramatiq --processes $DRAMATIQ_PROCESSES --threads $DRAMATIQ_THREADS
