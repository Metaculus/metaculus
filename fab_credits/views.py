import json
import logging
from typing import Any, Callable  # noqa: UP035

import requests
from django.conf import settings
from django.http import JsonResponse, StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .models import UserUsage


def is_valid_json(input_string):
    try:
        json.loads(input_string)
        return True
    except ValueError:
        return False


def streaming_response(
    url,
    headers,
    data,
    platform: UserUsage.UsagePlatform,
    user_usage,
    get_io_tokens_streaming_fn: Callable[dict[Any], tuple[int | None, int | None]],
):

    if platform == UserUsage.UsagePlatform.OpenAI:
        data["stream_options"] = {"include_usage": True}

    platform_response = requests.post(url, headers=headers, json=data, stream=True)

    if not platform_response.ok:
        raise Exception(platform_response.text)

    def resp_iterator(response):
        for line in response.iter_lines():
            if line:
                line = f"\n{line.decode('utf-8')}\n"
                input_tokens, output_tokens = get_io_tokens_streaming_fn(line)
                if input_tokens is not None or output_tokens is not None:
                    user_usage.input_tokens_used += input_tokens or 0
                    user_usage.output_tokens_used += output_tokens or 0
                    user_usage.save()
                yield line

    return StreamingHttpResponse(
        resp_iterator(platform_response), content_type="text/event-stream"
    )


def normal_response(
    url,
    headers,
    data,
    platform: UserUsage.UsagePlatform,
    user_usage,
    get_io_tokens_fn: Callable[dict[Any], tuple[int, int]],
):
    platform_response = requests.post(
        url,
        headers=headers,
        json=data,
    )
    if not platform_response.ok or not is_valid_json(platform_response.text):
        raise Exception(platform_response.text)

    response_data = platform_response.json()

    input_tokens, output_tokens = get_io_tokens_fn(response_data)

    user_usage.input_tokens_used += input_tokens
    user_usage.output_tokens_used += output_tokens

    user_usage.save()

    return JsonResponse(response_data)


def make_request(
    user,
    data,
    platform: UserUsage.UsagePlatform,
    model_name: str,
    headers: dict[str, str],
    url: str,
    get_io_tokens_fn: Callable[dict[Any], tuple[int, int]],
    get_io_tokens_streaming_fn: Callable[dict[Any], tuple[int, int]],
    streaming_mode: bool,
):
    user_usage = UserUsage.objects.filter(
        user=user, platform=platform, model_name=model_name
    ).first()

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
            return streaming_response(
                url, headers, data, platform, user_usage, get_io_tokens_streaming_fn
            )
        else:
            return normal_response(
                url, headers, data, platform, user_usage, get_io_tokens_fn
            )

    except requests.exceptions.RequestException as e:
        error_msg = f"Error forwarding request to {'Anthropic' if platform == UserUsage.UsagePlatform.Anthropic else 'OpenAI'} API: {e}"
        logging.error(error_msg)
        return JsonResponse(
            {"error": error_msg},
            status=400,
        )
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {e}"}, status=400)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def openai_v1_chat_completions(request):

    headers = {**request.headers}
    headers["Authorization"] = f"Bearer {settings.FAB_CREDITS_OPENAI_API_KEY}"
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
            data.get("usage").get("prompt_tokens"),
            data.get("usage").get("completion_tokens"),
        )

    def get_io_tokens_streaming_fn(line):
        line = line.strip()

        data_str = line[len("data: ") :]

        try:
            data = json.loads(data_str)

            if data["usage"] is None:
                return None, None

            return get_io_tokens_fn(data)
        except json.JSONDecodeError:
            # last line is not a valid json, but a [DONE] token after Data
            return None, None

    response = make_request(
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def anthropic_v1_messages(request):

    headers = {**request.headers}
    headers["x-api-key"] = settings.FAB_CREDITS_ANTHROPIC_API_KEY
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
            logging.error("Invalid json data: ", data_str)
            raise e

    response = make_request(
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
