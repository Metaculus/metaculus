release: poetry run python manage.py migrate
web: poetry run gunicorn metaculus_web.wsgi:application --workers 8 --bind 0.0.0.0:8000 &; cd front_end && npm run start -- -p 3000
dramatiq: poetry run python3 manage.py rundramatiq --processes 8 --threads 16
django_cron: poetry run python3 manage.py cron
