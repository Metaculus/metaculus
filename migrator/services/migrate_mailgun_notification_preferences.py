# Function to fetch unsubscribes with pagination
import logging

import requests
from django.conf import settings

from users.models import User

logger = logging.getLogger(__name__)


def fetch_unsubscribes(url=None, unsubscribes=None):
    unsubscribes = unsubscribes or []
    url = (
        url
        or f"https://api.mailgun.net/v3/{settings.MAILGUN_SUBDOMAIN}/unsubscribes?limit=1000"
    )

    response = requests.get(url, auth=("api", settings.MAILGUN_API_KEY))
    data = response.json()
    # @TODO @Hlib this item does not exist
    items = data.get("items", [])

    # Extract the unsubscribe items
    unsubscribes.extend(items)

    # Get the next page URL
    next_url = data.get("paging", {}).get("next", None)

    # Optional: print progress
    print(f"Fetched {len(unsubscribes)} mailgun subscriptions", end="\r")

    if next_url and items:
        return fetch_unsubscribes(next_url, unsubscribes)
    else:
        return unsubscribes


def migrate_mailgun_notification_preferences():
    # TODO: migrate "Metaculus Newsletter"
    # TODO: migrate "Significant movement on all predicted questions"

    # Fetch all unsubscribes
    unsubscribes_list = fetch_unsubscribes()
    unsubscribes_list_map = {
        item["address"].lower(): {"tags": item["tags"]} for item in unsubscribes_list
    }

    allowed_tags = [
        "comment_mentions",
        "question_resolution",
        "tournament_new_questions",
        # All other will be deprecated:
        #   "new_tournaments",
        #   "question_halfway",
        #   "question_resolution",
    ]

    users_to_update = []

    for user in User.objects.all().iterator(chunk_size=1000):
        config = unsubscribes_list_map.get(user.email.lower())

        if config:
            tags = config.get("tags", [])
            unsubscribed_mailing_tags = [tag for tag in tags if tag in allowed_tags]

            if unsubscribed_mailing_tags:
                user.unsubscribed_mailing_tags = unsubscribed_mailing_tags
                users_to_update.append(user)

    User.objects.bulk_update(users_to_update, fields=["unsubscribed_mailing_tags"])
    logger.info(f"Updated mailing preferences for {len(users_to_update)} users")
