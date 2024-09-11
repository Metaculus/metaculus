#! /bin/bash
set -e

required_vars=("HEROKU_APP")

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
docker build --platform linux/amd64 -t registry.heroku.com/$HEROKU_APP/web .

docker push registry.heroku.com/$HEROKU_APP/web

heroku container:release web -a $HEROKU_APP

wait_and_fail_if_release_failed
