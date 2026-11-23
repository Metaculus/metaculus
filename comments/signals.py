from django.db.models.signals import post_delete, pre_delete
from django.dispatch import receiver

from comments.models import KeyFactor, KeyFactorBaseRate, KeyFactorDriver, KeyFactorNews

CONTENT_FIELDS = (
    ("driver_id", KeyFactorDriver),
    ("base_rate_id", KeyFactorBaseRate),
    ("news_id", KeyFactorNews),
)


@receiver(pre_delete, sender=KeyFactor)
def remember_key_factor_content(sender, instance: KeyFactor, **kwargs):
    # Read the ids while the row still exists: on an instance loaded with
    # .only(), reading a deferred id after the delete would query a missing row.
    instance._content_to_delete = [
        (model, getattr(instance, field)) for field, model in CONTENT_FIELDS
    ]


@receiver(post_delete, sender=KeyFactor)
def delete_key_factor_content(sender, instance: KeyFactor, using, **kwargs):
    """
    KeyFactor holds the one-to-one link to its driver, base rate or news item,
    so deleting a key factor doesn't delete that row. This covers every ORM
    deletion: delete_key_factor, cascades from a deleted comment, the admin and
    queryset deletes.
    """

    for model, pk in getattr(instance, "_content_to_delete", []):
        if pk:
            model.objects.using(using).filter(pk=pk).delete()
