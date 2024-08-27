#! /bin/bash

cd /app/
source venv/bin/activate

# PORT is passed by Heroku, and should be the one where nextjs lists on
python manage.py migrate