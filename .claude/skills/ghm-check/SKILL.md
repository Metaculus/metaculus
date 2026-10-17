---
name: ghm-check
description: Check that the latest Global Health Monitor edition's wording still matches the live forecasts, and open a minimal fix PR if it has drifted. Use for the scheduled daily check.
---

# Daily Global Health Monitor wording check

Only the latest edition is in scope: the first entry of `EDITIONS` in `front_end/src/app/(main)/global-health-monitor/editions/index.ts`. Forecast numbers are live tokens and `<Trend>` wording updates itself, so only hand-written interpretation can drift.

1. Run `cd front_end && bun run ghm:inputs --since <latest edition's asOf date, YYYY-MM-DD>` (needs `METACULUS_API_TOKEN`) and read `front_end/.ghm/inputs.md`.
2. Read the latest edition file. For every sentence that interprets a forecast, compare it with the current values and changes:
   - fixed directions or sizes ("rose", "fell", "steady", "doubled", "sharp") against the change since the previous edition;
   - rankings and comparisons between values;
   - claims about the most likely multiple choice option;
   - thresholds ("above 10,000", "under 5%");
   - questions that have resolved but are described as open, or forecasts marked "CP lapsed".
   Changes marked steady don't need edits.
3. If nothing drifted, stop without opening a PR.
4. Otherwise make the smallest edit that makes each sentence true again. Prefer swapping fixed words for a `<Trend>` or `<Forecast>` token over rewording, keep the voice, and never touch past editions.
5. Run `cd front_end && bun run lint && bun run format && bun run test -- "src/app/\(main\)/global-health-monitor"`, then open a PR titled `fix: global health monitor commentary — <short summary>`. List each changed sentence with the value that made it wrong.
