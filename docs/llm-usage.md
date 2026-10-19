# LLM usage

All LLM calls go through [OpenRouter](https://openrouter.ai). No direct OpenAI/Anthropic keys or endpoints.

- Key: `OPENROUTER_API_KEY` (backend `.env`, `front_end/.env`, GitHub secrets).
- Backend: use `get_llm_client()` / `get_llm_client_async()` from `utils/llm.py`.
- Models: OpenRouter ids, e.g. `openai/gpt-6-luna`, `openai/text-embedding-3-large`.

## Tag every request

Pass a feature tag as `user`. OpenRouter Activity filters and groups spend by it.

```python
get_llm_client().chat.completions.create(
    model="openai/gpt-6-luna",
    messages=[...],
    **llm_options(LLMFeature.KEY_FACTORS),
)
```

- Backend tags: `LLMFeature` in `utils/llm.py`. New feature → new member.
- `llm_options()` also pins routing: OpenAI-hosted endpoints first, only endpoints that support every sent parameter.
- Scripts outside Django set `user` directly: `comms-digest` (`scripts/weekly_comms_digest.py`), `translations` (`front_end/scripts/add_missing_translations.mjs`).

## Defaults

- Request blocks a user → `reasoning_effort="none"` unless measured otherwise.
- Structured output → `chat.completions.parse(response_format=PydanticModel)`.
- Hand-written `json_schema` → set `"strict": False` unless the schema is strict-compatible; OpenRouter enforces strict for OpenAI models.
