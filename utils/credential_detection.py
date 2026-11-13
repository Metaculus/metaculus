import re
from dataclasses import dataclass

# Credentials are only recognised by a provider's fixed prefix plus a long random
# body, so prose that merely mentions a prefix (e.g. "an sk-or- key") never matches.
_NOT_AFTER_TOKEN_CHAR = r"(?<![A-Za-z0-9\-])"
_NOT_BEFORE_TOKEN_CHAR = r"(?![A-Za-z0-9\-])"


@dataclass(frozen=True)
class CredentialFormat:
    provider: str
    pattern: re.Pattern


def _credential_format(provider: str, body_regex: str) -> CredentialFormat:
    return CredentialFormat(
        provider=provider, pattern=re.compile(_NOT_AFTER_TOKEN_CHAR + body_regex)
    )


CREDENTIAL_FORMATS: tuple[CredentialFormat, ...] = (
    _credential_format("OpenRouter", r"sk-or-v1-[0-9a-f]{64}"),
    _credential_format("Anthropic", r"sk-ant-[a-z]+\d{2}-[A-Za-z0-9_\-]{80,}"),
    _credential_format("OpenAI", r"sk-(?:proj|svcacct|admin)-[A-Za-z0-9_\-]{40,}"),
    _credential_format("OpenAI", r"sk-[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20}"),
    _credential_format("DeepSeek", r"sk-[0-9a-f]{32}" + _NOT_BEFORE_TOKEN_CHAR),
    _credential_format("Perplexity", r"pplx-[A-Za-z0-9]{40,}"),
    _credential_format("Google", r"AIza[0-9A-Za-z_\-]{35}"),
    _credential_format("xAI", r"xai-[A-Za-z0-9]{70,}"),
    _credential_format("Groq", r"gsk_[A-Za-z0-9]{48,}"),
    _credential_format("Hugging Face", r"hf_[A-Za-z0-9]{30,}"),
    _credential_format("Tavily", r"tvly-(?:dev-|prod-)?[A-Za-z0-9]{24,}"),
    _credential_format("Firecrawl", r"fc-[0-9a-f]{32}"),
    _credential_format("E2B", r"e2b_[0-9a-f]{40}"),
    _credential_format("GitHub", r"gh[pousr]_[A-Za-z0-9]{36,}"),
    _credential_format("GitHub", r"github_pat_[A-Za-z0-9_]{80,}"),
    _credential_format("Slack", r"xox[abeprs]-\d+-[A-Za-z0-9\-]{20,}"),
    _credential_format("Slack", r"xapp-\d-[A-Za-z0-9\-]{20,}"),
    _credential_format("PyPI", r"pypi-AgEIcHlwaS5vcmc[A-Za-z0-9_\-]{50,}"),
)


def find_credential_providers(text: str) -> list[str]:
    """Providers whose credential format appears in the text, in list order."""

    # Markdown escapes such as `hf\_` render back to a working key
    unescaped_text = text.replace("\\_", "_").replace("\\-", "-")
    providers = []
    for credential_format in CREDENTIAL_FORMATS:
        if (
            credential_format.provider not in providers
            and credential_format.pattern.search(unescaped_text)
        ):
            providers.append(credential_format.provider)

    return providers
