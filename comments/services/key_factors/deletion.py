from django.db import transaction
from django.db.models import QuerySet

from comments.models import KeyFactor, KeyFactorBaseRate, KeyFactorDriver, KeyFactorNews


@transaction.atomic
def delete_key_factors(key_factors: QuerySet[KeyFactor]) -> None:
    """
    Deletes key factors together with their driver, base rate or news rows.

    KeyFactor holds the one-to-one link to that row, so deleting a key factor,
    directly or through a cascade from its comment, question or post, leaves the
    row behind with the text the user wrote. Call this before any such deletion.
    """

    # Read the ids and links in one query and delete exactly those key factors,
    # so one committed concurrently can't be deleted without its content.
    rows = list(key_factors.values_list("pk", "driver_id", "base_rate_id", "news_id"))
    if not rows:
        return

    pks, *content_ids = zip(*rows)
    KeyFactor.objects.filter(pk__in=pks).delete()

    for model, ids in zip(
        (KeyFactorDriver, KeyFactorBaseRate, KeyFactorNews), content_ids
    ):
        model.objects.filter(pk__in=[pk for pk in ids if pk]).delete()
