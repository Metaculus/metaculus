import datetime
import posixpath

from django.core.files.utils import validate_file_name
from imagekit import ImageSpec
from pilkit.processors import ResizeToFit


class UserUploadedImage(ImageSpec):
    processors = [ResizeToFit(1280, 1280)]
    format = "JPEG"
    options = {"quality": 75}


def generate_filename(storage, filename: str, upload_to: str = ""):
    """
    Generates Safe filename
    """

    dirname = datetime.datetime.now().strftime(str(upload_to))
    filename = posixpath.join(dirname, filename)
    filename = validate_file_name(filename, allow_relative_path=True)

    return storage.generate_filename(filename)
