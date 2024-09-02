#! /bin/bash
set -e
required_vars=("NEXT_PUBLIC_TURNSTILE_SITE_KEY" "HEROKU_APP" "NEXT_PUBLIC_APP_URL")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: $var environment variable is not set."
        exit 1
    fi
done

wait_and_fail_if_release_failed() {
    max_iters=20
    for ((i = 1; i <= max_iters; i++)); do
        json=$(heroku releases --json)
        # Extract the status and current fields from the first element of the array
        status=$(echo "$json" | jq -r '.[0].status')
        current=$(echo "$json" | jq -r '.[0].current')

        [ "$status" == "pending" ] && echo "Waiting for release to finish" && sleep 3 && continue

        [ "$status" == "succeeded" ] && [ "$current" == "true" ] && echo "Release succeeded " && exit 0

        break
    done

    echo "Release failed."
    exit 1
}

# These are needed for nextjs build phase, as it replaces the value of these environmental variables
# at build time :/
FRONTEND_ENV_FILE=$(mktemp)
env | grep NEXT_PUBLIC > $FRONTEND_ENV_FILE

docker buildx build \
    --secret id=frontend_env,src=$FRONTEND_ENV_FILE \
    --platform linux/amd64 -t registry.heroku.com/$HEROKU_APP/web --target web .

# The rest of the target images don't require any special env variables
for target in release dramatiq_worker django_cron; do
    docker build --platform linux/amd64 . -t registry.heroku.com/$HEROKU_APP/$target --target $target
done

# Push all built images to the heroku docker registry
for target in release dramatiq_worker django_cron web; do
    docker push registry.heroku.com/$HEROKU_APP/$target
done

# Release them all
heroku container:release release web dramatiq_worker django_cron -a $HEROKU_APP

wait_and_fail_if_release_failed