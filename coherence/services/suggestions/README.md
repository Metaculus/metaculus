# AI-suggested question links

Suggests question links (coherence links) for the Add Question Link modal.
Five methods vote on candidate questions; a candidate's score is how many
methods voted for it:

| method             | what it is                                        | cost |
| ------------------ | ------------------------------------------------- | ---- |
| `llm_broad`        | LLM over the full question pool, high recall      | paid |
| `llm_strict`       | LLM over the full pool, causal influence only     | paid |
| `llm_similar_only` | LLM (strict) over an embedding shortlist          | paid |
| `similar`          | the existing Similar Questions signal             | free |
| `community_link`   | an AggregateCoherenceLink exists for the pair     | free |

Votes live on one `CoherenceLinkSuggestion` row per eligible target
question, updated in place — the table never grows and needs no cleanup.
A daily cron batch (`coherence.jobs`) refreshes the free votes for every
eligible question and runs the LLM methods on stale targets, most popular
first, until the daily budget is exhausted. Staleness scales with
popularity: the most popular questions refresh about weekly, the least
popular about quarterly. The modal falls back to the plain
similar-questions list whenever no suggestions are available.

## Module map

| file           | responsibility                                          |
| -------------- | ------------------------------------------------------- |
| `pool.py`      | eligibility rules, candidate pool, popularity ranking   |
| `prompts.py`   | model choice, prompt text, context-window fitting       |
| `llm.py`       | OpenAI transport: pricing, retries, response parsing    |
| `parsing.py`   | tolerant JSON fallback for almost-JSON responses        |
| `methods.py`   | the five voting methods (compute only)                  |
| `pipeline.py`  | the two write paths (paid run / free refresh)           |
| `budget.py`    | daily USD spend guard                                   |
| `scheduler.py` | the daily batch                                         |
| `stats.py`     | numbers for `manage.py suggestion_stats`                |
| `read.py`      | modal read path (aggregate votes, permission filtering) |

## Deployment

1. Migrations: `coherence.0005` creates the table.
2. Environment:
   - `SUGGESTIONS_AI_ENABLED` — master switch, off by default. While off,
     the cron job no-ops and the API returns empty lists; nothing is
     computed and nothing is spent.
   - `OPENAI_API_KEY_QUESTION_LINKS` — dedicated key so spend is
     attributable on the OpenAI dashboard. Required; there is no fallback
     to `OPENAI_API_KEY`.
   - `SUGGESTIONS_LIMIT_USD_DAILY` (default 5) — daily LLM spend ceiling.
3. Flip `SUGGESTIONS_AI_ENABLED=true`. Coverage builds from the most
   popular questions down, and at production volumes the daily budget is
   the binding constraint — expect the full budget to be spent every day,
   with `SUGGESTIONS_LIMIT_USD_DAILY` deciding how deep into the
   popularity ranking coverage reaches. `manage.py suggestion_stats`
   shows coverage and spend.
