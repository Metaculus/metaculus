# Taken from https://github.com/HackSoftware/Django-Styleguide-Example
from typing import TypeVar

from django.db import models

# Generic type for a Django model
DjangoModelType = TypeVar("DjangoModelType", bound=models.Model)
