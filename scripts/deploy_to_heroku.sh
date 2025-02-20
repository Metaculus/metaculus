#! /bin/bash
set -e

wait_and_fail_if_release_failed() {
    max_iters=40
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


for target in release dramatiq_worker django_cron web; do
    docker build --platform linux/amd64 . -t registry.heroku.com/$HEROKU_APP/$target --target $target --push
done

# Release them all
heroku container:release release web dramatiq_worker django_cron -a $HEROKU_APP

wait_and_fail_if_release_failed
