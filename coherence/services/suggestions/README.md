# AI-suggested question links

Suggests question links for the Add Question Link modal. The first time someone opens the
modal on a question, its suggestions are computed (~6–10 s) and stored on a
`CoherenceLinkSuggestion` row. Later opens reuse the row for 30 days, or 1 day when a model
was unavailable and a fallback produced it.

## How suggestions are computed

1. **Similarity:** cosine between the target's post embedding and every candidate's (the
   vectors behind Similar Questions).
2. **Scan:** OpenAI's decision model scores every candidate against the target on a 5-level
   scale. That's 200 candidates per request, with all requests in parallel (~2 s).
3. **Shortlist:** the best 30 by score + 2 × similarity, plus the best 20 of the rest by score
   alone. The second group is the non-obvious candidates that similarity would bury.
4. **Rerank:** `gpt-6.1-sol` grades each shortlisted candidate 0–4 and configures the link:
   which question is the cause, the sign, and the strength. This runs as 5 parallel calls on
   the fast tier (~3–5 s).

The modal shows every candidate graded 3–4 (up to 12), topped up with grade-2 ones when fewer
than 5 qualify. Candidates only ever come from `public_linkable_questions()`. A private target
works, but only for users who can see it.

One computation costs ~$0.16 with today's ~4k eligible questions and ~$0.23 at 7k.

## When things fail

| what fails | what happens |
| --- | --- |
| some decision requests | those candidates rank by similarity alone |
| `gpt-6.1-sol` on a call | that call is retried with `gpt-6-luna` |
| every rerank call, or the 18 s deadline | the endpoint returns the previous suggestions if it has any; otherwise none, and the modal shows Similar Questions |

Results from a fallback are marked `degraded` and recomputed after a day. Each kind of failure
logs at ERROR (Sentry) at most once an hour, and at WARNING otherwise.

## Settings

- `QUESTION_LINK_SUGGESTIONS_ENABLED`: master switch, off by default. While off, nothing is
  computed, served or spent.
- `OPENROUTER_API_KEY`: required; without it the endpoint returns no suggestions.

Spend shows up under the `question-links` tag in OpenRouter's Activity. There's no
feature-level cap: the organisation-wide OpenRouter budget covers every feature.

## Modules

| file | responsibility |
| --- | --- |
| `service.py` | eligibility, caching, the pipeline, what's shown |
| `llm.py` | OpenRouter calls: scan, rerank, fallbacks, alerts |
| `prompts.py` | prompt text and the rerank's response schema |
