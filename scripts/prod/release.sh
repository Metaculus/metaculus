#! /bin/bash

echo "Starting release script"
cd /app/
source venv/bin/activate

echo "Migrating database"
python manage.py migrate
echo "Done migrating database"
