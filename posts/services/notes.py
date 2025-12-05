from django.utils import timezone
from rest_framework.exceptions import ValidationError

from posts.models import Post
from users.models import User


def update_private_note(user: User, post: Post, text: str):
    snapshot = post.snapshots.filter(user=user).first()

    if not snapshot:
        raise ValidationError("User post snapshot does not exist")

    snapshot.private_note = text
    snapshot.private_note_updated_at = timezone.now()

    snapshot.save(update_fields=["private_note", "private_note_updated_at"])
