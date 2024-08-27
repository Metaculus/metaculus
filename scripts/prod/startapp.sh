#! /bin/bash

cd /app/
source venv/bin/activate

# PORT is passed by Heroku, and should be the one where nextjs lists on
gunicorn metaculus_web.wsgi:application --workers 8 --bind 0.0.0.0:8000 &


cd front_end
NEXT_PUBLIC_APP_URL=http://localhost:$PORT && npm run start