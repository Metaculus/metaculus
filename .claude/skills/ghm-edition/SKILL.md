---
name: ghm-edition
description: Draft the next monthly Global Health Monitor edition (key takeaways, disease write-ups, Pro Forecaster summaries, dated source figures) as a pull request. Use when asked to draft, prepare or finalize a Global Health Monitor edition.
---

# Drafting a Global Health Monitor edition

The dashboard lives in `front_end/src/app/(main)/global-health-monitor/`. Each edition is a TSX file in `editions/`, registered newest first in `EDITIONS` in `editions/index.ts`. Read the latest edition before writing: follow its structure, tokens and voice.

## 1. Gather inputs

1. Find the latest edition: the first entry of `EDITIONS`. Its date is the day part of its `asOf`.
2. Run `cd front_end && bun run ghm:inputs --since <latest edition's asOf date, YYYY-MM-DD>`. It needs `METACULUS_API_TOKEN` against metaculus.com. It writes, in `front_end/.ghm/`:
   - `inputs.md`: every value now, at the last edition and the change, plus resolved, lapsed and closing-soon questions, and open questions in project 33073 that aren't in the config yet.
   - `inputs.json`: the same values, comments since the last edition (`isPro` marks Pro Forecasters), machine-readable sources (CDC RESP-NET weekly rates, ECDC chikungunya clusters CSV, CDC measles chart data) and `sourcePages`, the plain text of each source page the edition cites.
3. Read `inputs.md` fully, then the comments and sources in `inputs.json`.
4. Use only figures you actually read in the inputs, each with the date its source gives. If a page is missing or empty (the CDC flu severity page renders client-side), say so in the PR instead of guessing.

## 2. Write the edition

Editions are named by month ("October 2026"); the page never shows the publication day. Create `editions/edition_YYYY_MM.tsx` for the publication month (the issue's date, or today), exporting `EDITION_YYYY_MM: Edition`:

- `slug: "YYYY-MM"`, `asOf: "YYYY-MM-DDT12:00:00Z"` (the publication day, used to compare forecasts).
- `takeaways`: 4 to 6, only for diseases that moved or matter this month. Each has `id`, `diseases`, `lead` (the value key whose chart sits next to the takeaways) and `content`.
- `sections`: one entry per disease covered:
  - `body`: 1 to 3 short paragraphs: what the data shows (with sources), what forecasters expect, and why it moved.
  - `proSummary`: 2 to 3 sentences summarizing the Pro Forecasters' reasoning since the last edition. Don't label it as AI-written and don't name individuals.
  - `quote` (optional): a verbatim excerpt of one Pro comment, with its `commentId`, `author` and `date`.
  - `sources`: the `SourceSnapshot`s used in the body.
- Diseases with nothing new can be left out; the page still shows their title and live forecasts.
- Diseases laid out as `column` in `config/sections.ts` show only their title and chart, grouped as "Other diseases". Don't write a section for them; move a disease out of `column` when it needs text.

Writing rules:

- Every forecast number is a token: `<Forecast v="key" />`, with `change`, `interval` or `suffix` as needed. Never type a forecast number into prose; tokens render live values in the latest edition and frozen values once it's archived.
- Use `<Trend v="key" up="…" down="…" steady="…" />` instead of fixed words like "rose" or "held steady".
- Refer to other editions by month ("since August"), never by day.
- Every external figure is `<DataPoint s={SRC.x}>…</DataPoint>` backed by `defineSources` (`source`, `label`, `value`, `asOf`, optional `url`). Add new sources to `config/sources.ts`.
- Link Pro reasoning with `<ProComment c={PRO.x}>…</ProComment>` backed by `defineProComments`.
- Give places, dates and jargon context with `<Term tip="…">…</Term>`; link disease names with `<DiseaseLink d="…">`.
- English only, in the voice of previous editions: concrete, sourced, no hype.
- Never edit past edition files.

## 3. Update the config

- Put the new edition first in `EDITIONS`.
- Section layout comes from `config/sections.ts`: 4+ cards get a carousel, fewer get text beside charts, and `layout: "column"` puts consecutive small sections side by side (up to three per row). Use `column` for diseases with one question and little news.
- Remove the cards of questions that resolved before the previous edition from `config/sections.ts`. Keep their keys in `config/questions.ts`, because past editions use them.
- Add new questions listed in `inputs.md`: value keys in `config/questions.ts` (match sub-questions by ID, never by label; set `tone` for good/bad colours) and cards in the right section. A card for a single question takes `value` (the key whose move since the last edition shows on the card); group cards take none. Flag anything you weren't sure how to place.

## 4. Check and open the PR

1. `cd front_end && bun run lint && bun run format && bun run test -- "src/app/\(main\)/global-health-monitor"`.
2. Open a PR titled `feat: global health monitor — <Month YYYY> edition` that links the request issue. The body lists:
   - every value used, with now, at the last edition and change (from `inputs.md`);
   - each source figure with its date and link;
   - the Pro comments summarized, as links;
   - config changes (resolved and new questions);
   - a reviewer checklist: numbers, wording, summaries, sources.

## Finalizing (right before merge)

When asked to finalize, run `cd front_end && bun run ghm:bake` and paste the printed `asOf` and `frozen` values into the new edition. This freezes the publication-day numbers for when the edition is archived.
