#! /bin/bash

cd /app/
source venv/bin/activate

# PORT is passed by Heroku, and should be the one where nextjs lists on
poetry run gunicorn metaculus_web.wsgi:application --workers 8 --bind 0.0.0.0:$PORT