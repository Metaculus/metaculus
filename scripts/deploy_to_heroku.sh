#! /bin/bash
set -x

[ -z "$HEROKU_APP" ] && { echo "Error: HEROKU_APP env varible is not set."; exit 1; }

# Push container
heroku container:push release --arg ENTRY_SCRIPT_ARG="scripts/prod/release.sh" -a $HEROKU_APP
heroku container:push web --arg ENTRY_SCRIPT_ARG="scripts/prod/startapp.sh" -a $HEROKU_APP
heroku container:push dramatiq_worker --arg ENTRY_SCRIPT_ARG="scripts/prod/run_dramatiq.sh" -a $HEROKU_APP
heroku container:push django_cron --arg ENTRY_SCRIPT_ARG="scripts/prod/django_cron.sh" -a $HEROKU_APP

# Release them
heroku container:release release -a $HEROKU_APP
heroku container:release web -a $HEROKU_APP
heroku container:release dramatiq_worker -a $HEROKU_APP
heroku container:release django_cron -a $HEROKU_APP
