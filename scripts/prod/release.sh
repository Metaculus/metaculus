#! /bin/bash

cd /app/
source venv/bin/activate

python manage.py migrate
