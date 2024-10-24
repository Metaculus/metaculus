import json
import logging
from typing import Any, Callable

import aiohttp
from adrf.decorators import api_view
from django.conf import settings
from django.db import transaction
from django.http import JsonResponse, StreamingHttpResponse
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated

from .models import UserUsage

logger = logging.getLogger(__name__)


def is_valid_json(input_string):
    try:
        json.loads(input_string)
        return True
    except ValueError:
        return False


async def streaming_iterator(
    url,
    headers,
    data,
    platform: UserUsage.UsagePlatform,
    user_usage,
    get_io_tokens_streaming_fn: Callable[[str], tuple[int | None, int | None]],
):
    if platform == UserUsage.UsagePlatform.OpenAI:
        data["stream_options"] = {"include_usage": True}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as response:
            if response.status >= 400:
                response_text = await response.text()
                raise Exception(response_text)

            async for line in response.content:
                line = line.decode("utf-8").replace("\n", "")

                if line:
                    line = f"\n{line}\n"
                    input_tokens, output_tokens = get_io_tokens_streaming_fn(line)
                    if input_tokens is not None or output_tokens is not None:
                        user_usage.input_tokens_used += input_tokens or 0
                        user_usage.output_tokens_used += output_tokens or 0
                        await user_usage.asave()

                    print(f"LINE: |{line}|")

                    yield line


async def streaming_response(
    url,
    headers,
    data,
    platform: UserUsage.UsagePlatform,
    user_usage,
    get_io_tokens_streaming_fn: Callable[[str], tuple[int | None, int | None]],
):
    """
    When serving under WSGI, this should be a sync iterator.
    When serving under ASGI, then it should be an async iterator.
    """

    return StreamingHttpResponse(
        streaming_iterator(
            url, headers, data, platform, user_usage, get_io_tokens_streaming_fn
        ),
        content_type="text/event-stream",
    )


async def normal_response(
    url,
    headers,
    data,
    platform: UserUsage.UsagePlatform,
    user_usage,
    get_io_tokens_fn: Callable[[Any], tuple[int, int]],
):
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as platform_response:
            response_text = await platform_response.text()
            if platform_response.status != 200 or not is_valid_json(response_text):
                raise Exception(response_text)

            response_data = json.loads(response_text)

            input_tokens, output_tokens = get_io_tokens_fn(response_data)

            user_usage.input_tokens_used += input_tokens
            user_usage.output_tokens_used += output_tokens

            user_usage.asave()

            return JsonResponse(response_data)


async def make_request(
    user,
    data,
    platform: UserUsage.UsagePlatform,
    model_name: str,
    headers: dict[str, str],
    url: str,
    get_io_tokens_fn: Callable[[Any], tuple[int, int]],
    get_io_tokens_streaming_fn: Callable[[Any], tuple[int, int]],
    streaming_mode: bool,
):
    user_usage = await UserUsage.objects.filter(
        user=user, platform=platform, model_name=model_name
    ).afirst()

    if user_usage is None:
        return JsonResponse(
            {
                "error": f"You don't have an allowance for model <{model_name}> on <{platform.label}>  ."
            },
            status=400,
        )

    if (
        user_usage.input_tokens_used + user_usage.output_tokens_used
        >= user_usage.total_allowed_tokens
    ):
        return JsonResponse(
            {"error": "You have exceeded your credit allowance."}, status=400
        )

    try:
        if streaming_mode:
            return await streaming_response(
                url, headers, data, platform, user_usage, get_io_tokens_streaming_fn
            )
        else:
            return await normal_response(
                url, headers, data, platform, user_usage, get_io_tokens_fn
            )

    except aiohttp.ClientError as e:
        error_msg = f"Error forwarding request to {'Anthropic' if platform == UserUsage.UsagePlatform.Anthropic else 'OpenAI'} API: {e}"
        logger.exception(error_msg)
        return JsonResponse(
            {"error": error_msg},
            status=400,
        )
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {e}"}, status=400)


@transaction.non_atomic_requests
@api_view(["POST"])
@permission_classes([IsAuthenticated])
async def openai_v1_chat_completions(request):
    headers = {**request.headers}
    headers["Authorization"] = f"Bearer {settings.FAB_CREDITS_OPENAI_API_KEY}"
    headers.pop("Host", None)
    headers.pop("Content-Length", None)

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError as e:
        return JsonResponse(
            {"error": f"Invalid JSON data: {request.body}. Error: {e}"}, status=400
        )

    model_name = data.get("model", None)
    streaming_mode = data.get("stream", False)

    def get_io_tokens_fn(data):
        return (
            data.get("usage", {}).get("prompt_tokens", 0),
            data.get("usage", {}).get("completion_tokens", 0),
        )

    def get_io_tokens_streaming_fn(line):
        line = line.strip()

        if not line.startswith("data: "):
            return None, None

        data_str = line[len("data: ") :]

        try:
            data = json.loads(data_str)

            if data.get("usage") is None:
                return None, None

            return get_io_tokens_fn(data)
        except json.JSONDecodeError:
            # Last line might be '[DONE]' or invalid JSON
            return None, None

    response = await make_request(
        user=request.user,
        data=data,
        platform=UserUsage.UsagePlatform.OpenAI,
        headers=headers,
        url="https://api.openai.com/v1/chat/completions",
        model_name=model_name,
        get_io_tokens_fn=get_io_tokens_fn,
        get_io_tokens_streaming_fn=get_io_tokens_streaming_fn,
        streaming_mode=streaming_mode,
    )

    return response


@transaction.non_atomic_requests
@api_view(["POST"])
@permission_classes([IsAuthenticated])
async def anthropic_v1_messages(request):
    headers = {**request.headers, "x-api-key": settings.FAB_CREDITS_ANTHROPIC_API_KEY}
    headers.pop("Authorization")
    headers.pop("Host")

    try:
        data = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError as e:
        return JsonResponse(
            {"error": f"Invalid JSON data: {request.body}. Error: {e}"}, status=400
        )

    model_name = data.get("model", None)
    streaming_mode = data.get("stream", False)

    def get_io_tokens_fn(data):
        return (
            data.get("usage").get("input_tokens"),
            data.get("usage").get("output_tokens"),
        )

    def get_io_tokens_streaming_fn(line):
        line = line.strip()
        if not line.startswith("data: "):
            return None, None

        data_str = line[len("data: ") :]

        try:
            data = json.loads(data_str)

            usage_data = data.get("usage", None) or data.get("message", {}).get(
                "usage", None
            )
            if usage_data is None:
                return None, None

            return usage_data.get("input_tokens"), usage_data.get("output_tokens")
        except json.JSONDecodeError as e:
            logger.error("Invalid json data: ", data_str)
            raise e

    response = await make_request(
        user=request.user,
        data=data,
        platform=UserUsage.UsagePlatform.Anthropic,
        headers=headers,
        url="https://api.anthropic.com/v1/messages",
        get_io_tokens_fn=get_io_tokens_fn,
        get_io_tokens_streaming_fn=get_io_tokens_streaming_fn,
        model_name=model_name,
        streaming_mode=streaming_mode,
    )

    return response
