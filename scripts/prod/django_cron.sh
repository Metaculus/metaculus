#! /bin/bash

cd /app/
source venv/bin/activate

python3 manage.py cron
