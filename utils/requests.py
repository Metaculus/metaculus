from rest_framework.request import Request


def get_request_ip(request: Request) -> str:
    return (
        # Header coming from Cloudflare
        request.headers.get("CF-Connecting-IP")
        # Or coming from Nginx
        or request.headers.get("X-Real-IP")
    )
