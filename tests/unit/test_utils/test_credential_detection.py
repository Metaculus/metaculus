import pytest

from utils.credential_detection import find_credential_providers

HEX_64 = "0123456789abcdef" * 4
ALNUM_48 = "Ab3dE5gH7jK9" * 4


def config_snippet(api_key: str) -> str:
    return f"config = {{'model': 'gpt-5', 'api_key': '{api_key}'}}"


@pytest.mark.parametrize(
    "fake_key, provider",
    [
        ("sk-or-v1-" + HEX_64, "OpenRouter"),
        ("sk-ant-api03-" + "Ab3_dE5-gH7j" * 8, "Anthropic"),
        ("sk-proj-" + "Ab3_dE5-gH7j" * 5, "OpenAI"),
        ("sk-" + ALNUM_48[:20] + "T3BlbkFJ" + ALNUM_48[:20], "OpenAI"),
        ("sk-" + HEX_64[:32], "DeepSeek"),
        ("pplx-" + ALNUM_48, "Perplexity"),
        ("AIza" + "Ab3_dE5-gH7" * 3 + "Ab", "Google"),
        ("xai-" + ALNUM_48 * 2, "xAI"),
        ("gsk_" + ALNUM_48 + "Ab3d", "Groq"),
        ("hf_" + ALNUM_48[:34], "Hugging Face"),
        ("tvly-dev-" + ALNUM_48[:32], "Tavily"),
        ("fc-" + HEX_64[:32], "Firecrawl"),
        ("e2b_" + HEX_64[:40], "E2B"),
        ("ghp_" + ALNUM_48[:36], "GitHub"),
        ("github_pat_" + "Ab3_dE5gH7j" * 8, "GitHub"),
        ("xoxb-" + "1234567890-" * 3 + "Ab3dE5gH7j", "Slack"),
        ("xapp-1-" + "A0123456789-" * 3, "Slack"),
        ("pypi-AgEIcHlwaS5vcmc" + "Ab3_dE5-gH7j" * 5, "PyPI"),
    ],
)
def test_find_credential_providers__detects_known_formats(fake_key: str, provider: str):
    assert find_credential_providers(config_snippet(fake_key)) == [provider]
    assert find_credential_providers(f"My key is {fake_key}.") == [provider]


@pytest.mark.parametrize(
    "text",
    [
        "Store your sk-or- key in the OPENROUTER_API_KEY environment variable.",
        "We use sk-learn and pplx-sonar for research.",
        "config = {'model': 'gpt-5', 'max_tokens': 4096, 'api_key': None}",
        config_snippet("sk-or-v1-****************"),
        config_snippet("sk-or-v1-" + HEX_64[:20]),
        config_snippet("EMPTY"),
        "task-" + HEX_64[:32] + " finished",
        "Request id sk-" + HEX_64 + " (not a DeepSeek key, too long)",
        "Exa key 0f8fad5b-d9cb-469f-a165-70867728950e is a UUID with no prefix",
        "A forty-character hex token like " + HEX_64[:40] + " has no prefix",
        "xoxo-see-you-all-at-the-meetup-tonight",
    ],
)
def test_find_credential_providers__ignores_mentions_and_unprefixed_values(
    text: str,
):
    assert find_credential_providers(text) == []


def test_find_credential_providers__sees_through_markdown_escapes():
    escaped_key = "hf\\_" + ALNUM_48[:34]

    assert find_credential_providers(f"Token: {escaped_key}") == ["Hugging Face"]


def test_find_credential_providers__lists_each_provider_once():
    text = (
        config_snippet("sk-or-v1-" + HEX_64)
        + config_snippet("sk-or-v1-" + HEX_64[::-1])
        + " pplx-"
        + ALNUM_48
    )

    assert find_credential_providers(text) == ["OpenRouter", "Perplexity"]
