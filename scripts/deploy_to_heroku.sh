#! /bin/bash
set -e
set -x

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
    echo "elis_debug: Building docker image for target: $target"
    docker build --platform linux/amd64 . -t registry.heroku.com/$HEROKU_APP/$target --target $target
    echo "elis_debug: Pushing docker image for target: $target"
    docker push registry.heroku.com/$HEROKU_APP/$target
    echo "elis_debug: Pushed docker image for target: $target"
done

# Release them all
echo "elis_debug: Releasing targets: release web dramatiq_worker django_cron"

for target in release dramatiq_worker django_cron web; do
    echo "elis_debug: Releasing target: $target"
    heroku container:release $target -a $HEROKU_APP
    echo "elis_debug: Released target: $target"
done

wait_and_fail_if_release_failed
