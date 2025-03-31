import datetime
import posixpath

from PIL import Image
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile
from django.core.files.utils import validate_file_name
from rest_framework.exceptions import ValidationError


def generate_filename(storage, filename: str, upload_to: str = ""):
    """
    Generates Safe filename
    """

    dirname = datetime.datetime.now().strftime(str(upload_to))
    filename = posixpath.join(dirname, filename)
    filename = validate_file_name(filename, allow_relative_path=True)

    return storage.generate_filename(filename)


def validate_is_image(image_file: UploadedFile):
    try:
        image_file.seek(0)
        Image.open(image_file).verify()
        image_file.seek(0)
    except Exception:
        raise ValidationError({"image": "Uploaded file is not a valid image."})


def validate_and_upload_image(image_file: UploadedFile):
    if not image_file:
        raise ValidationError({"image": "No image file provided."})

    if image_file.size > settings.MAX_UPLOAD_SIZE:
        raise ValidationError({"image": "File size exceeds the allowed limit."})

    validate_is_image(image_file)

    filename = generate_filename(
        default_storage, image_file.name, upload_to="user_uploaded"
    )

    # Save the processed image using the default storage system
    filename = default_storage.save(filename, image_file, max_length=100)

    return default_storage.url(filename)
