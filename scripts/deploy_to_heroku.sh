#! /bin/bash

# Push container
heroku container:push release  --arg ENTRY_SCRIPT_ARG="scripts/prod/release.sh"
heroku container:push web  --arg ENTRY_SCRIPT_ARG="scripts/prod/startapp.sh"
heroku container:push dramatiq_worker  --arg ENTRY_SCRIPT_ARG="scripts/prod/run_dramatiq.sh"
heroku container:push django_cron  --arg ENTRY_SCRIPT_ARG="scripts/prod/django_cron.sh"

# Release them
heroku container:release release
heroku container:release web
heroku container:release dramatiq_worker
heroku container:release django_cron