release: python manage.py migrate && NODE_ENV=dev npm --prefix front_end run build
web: gunicorn metaculus_web.wsgi:application --workers 4 --bind 0.0.0.0:8000 & cd front_end && npm run start -- -p 3000
#dramatiq: python3 manage.py rundramatiq --processes 2 --threads 4
#django_cron: python3 manage.py cron
