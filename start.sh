ls;
poetry run gunicorn metaculus_web.wsgi:application --workers 4 --bind 0.0.0.0:8000 &
cd front_end;
npm run start -- -p 3000
