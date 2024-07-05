from django.core.validators import RegexValidator
from django.db import models
from django.db.models import F

from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    ``created_on`` and ``modified_on`` fields.
    """

    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    edited_at = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        abstract = True


validate_alpha_slug = RegexValidator(
    r"^[-a-zA-Z0-9_]*[a-zA-Z][-a-zA-Z0-9_]*\Z",
    _(
        "Enter a valid “slug” consisting of letters, numbers, underscores or hyphens. "
        "Must contain at least one letter."
    ),
    "invalid",
)


def build_order_by(value: str, is_desc: bool):
    """
    Builds order_by argument for django orm
    """

    q = F(value)

    return q.desc(nulls_last=True) if is_desc else q.asc(nulls_last=True)
