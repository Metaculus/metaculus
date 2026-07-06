import binascii
import os

from django.conf import settings
from django.db import models


class ApiKey(models.Model):
    """
    API key model with usage tracking.

    Replaces rest_framework.authtoken.models.Token to add last_used_at tracking.
    """

    key = models.CharField(max_length=40, primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="api_key",
        on_delete=models.CASCADE,
    )
    created = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.generate_key()
        return super().save(*args, **kwargs)

    @classmethod
    def generate_key(cls):
        return binascii.hexlify(os.urandom(20)).decode()

    def __str__(self):
        return self.key
