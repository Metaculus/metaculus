# Global Health Monitor editions

The dashboard at `/global-health-monitor/` is published as monthly editions. Each edition is a TSX file in `editions/`, registered newest first in `EDITIONS` in `editions/index.ts`.

Only the latest edition is live. Past editions (`?edition=YYYY-MM`) show their publication day: their own layout, and every card, chart and number as of their `asOf`. Their numeric curves are read from the aggregation explorer at render time, so publishing needs no extra step.

## Cadence

Editions are monthly, with no fixed day. Pro Forecasters are prompted around the 5th, and Grace sends her notes around the 15th. An engineer drafts the edition (Claude Code can follow this file), opens a PR for Grace to review on the preview, and merges it.

## 1. Gather inputs

Read the latest edition first and follow its structure, tokens and voice. Then collect, for the period since its `asOf`:

- **Forecasts:** the live dashboard shows every value and its change since the latest edition. Note questions that resolved, and open questions in the [tournament](https://www.metaculus.com/tournament/global-health-monitor-26-27/) that aren't on the dashboard yet.
- **Pro Forecaster comments:** on each question's page. Pros are currently Sergio and dimaklenchin.
- **Source figures:** from the pages in `config/sources.ts`, each with the date the source gives. If a page is missing or renders nothing, say so in the PR instead of guessing.

## 2. Write the edition

Editions are named by month ("October 2026"), and the page also shows the publication day from `asOf` ("Published October 15, 2026"). Create `editions/edition_YYYY_MM.tsx` exporting `EDITION_YYYY_MM: Edition`:

- `slug: "YYYY-MM"`, and `asOf: "YYYY-MM-DDT12:00:00Z"`, the publication day. Past editions are drawn as of this instant, so set it when you merge.
- `layout`: copy the previous edition's, then update it (see below).
- `takeaways`: 4 to 6, only for diseases that moved or matter this month. Each has `id`, `diseases`, `lead` (the value key whose chart sits next to the takeaways) and `content`.
- `sections`: one entry per disease covered:
  - `body`: 1 to 3 short paragraphs: what the data shows (with sources), what forecasters expect, and why it moved.
  - `proSummary`: 2 to 3 sentences summarizing the Pro Forecasters' reasoning since the last edition. Don't name individuals.
  - `quote` (optional): a verbatim excerpt of one Pro comment, with its `commentId`, `author` and `date`.
  - `sources`: the `SourceSnapshot`s used in the body.
- Diseases with nothing new can be left out; the page still shows their title and live forecasts.

Writing rules:

- Every forecast number is a token: `<Forecast v="key" />`, with `change`, `interval` or `suffix` as needed. Never type a forecast number into prose; tokens show live values in the latest edition and publication-day values once it's archived.
- Use `<Trend v="key" up="…" down="…" steady="…" />` instead of fixed words like "rose" or "held steady".
- Refer to other editions by month ("since August"), never by day.
- Every external figure is `<DataPoint s={SRC.x}>…</DataPoint>` backed by `defineSources` (`source`, `label`, `value`, `asOf`, optional `url`). Add new sources to `config/sources.ts`.
- Link Pro reasoning with `<ProComment c={PRO.x}>…</ProComment>` backed by `defineProComments`.
- Give places, dates and jargon context with `<Term tip="…">…</Term>`; link disease names with `<DiseaseLink d="…">`.
- English only, in the voice of previous editions: concrete, sourced, no hype.
- Never edit past edition files.

## 3. Layout and config

- Put the new edition first in `EDITIONS`. Its `layout` becomes the live page.
- Every full section shows its text, Pro summary and Latest data on the left and its cards stacked on the right. All `layout: "column"` sections share the "Other emerging diseases" row; use it for diseases with one question and little news.
- Keep the default order: Respiratory, Measles, Ebola, then the other diseases.
- **Promoting a disease.** When a minor disease is in the news (e.g. a large mpox outbreak), give it a full section: remove its `layout: "column"`, move it up the layout, and write its section. Demote it the same way once the news fades. Past editions keep their own layout.
- Remove the cards of questions that resolved since the previous edition; the live page showed their result until now. Mention notable resolutions in the takeaways. Keep their keys in `config/questions.ts`, because past editions use them.
- New questions get a value key in `config/questions.ts` (match sub-questions by ID, never by label; set `tone` for good/bad colours) and a card in the layout. A single-question card takes `value`, the key whose move since the last edition shows on the card; group cards take none.
- A question added mid-month goes into the latest edition's layout. Past editions hide cards whose question opened after their `asOf`.

## 4. Check and open the PR

1. `cd front_end && bun run lint && bun run format && bun run test -- "src/app/\(main\)/global-health-monitor"`.
2. Check the page locally, the latest and the previous edition (`?edition=YYYY-MM`).
3. Open a PR titled `feat: global health monitor — <Month YYYY> edition` that lists the source figures with their dates and links, the Pro comments summarized, and the layout changes. Grace reviews it on the PR preview.
