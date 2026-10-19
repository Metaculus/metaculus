# LLM usage

All LLM calls go through [OpenRouter](https://openrouter.ai). No direct OpenAI/Anthropic keys or endpoints.

- Key: `OPENROUTER_API_KEY` (backend `.env`, `front_end/.env`, GitHub secrets).
- Backend fallback: without `OPENROUTER_API_KEY`, calls go to OpenAI directly with `OPENAI_API_KEY`, untagged.
- Backend: use `get_llm_client()` / `get_llm_client_async()` from `utils/llm.py`.
- Models: `GENERAL_LLM_MODEL` and `LLM_EMBEDDING_MODEL` in `metaculus_web/settings.py`.

## Tag every request

Pass a feature tag as `user`. OpenRouter Activity filters and groups spend by it.

```python
get_llm_client().chat.completions.create(
    model=settings.GENERAL_LLM_MODEL,
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
