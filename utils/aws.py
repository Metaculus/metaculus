import boto3
from django.conf import settings


def get_boto_client(*args, **kwargs):
    return boto3.client(
        *args,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
        **kwargs,
    )
