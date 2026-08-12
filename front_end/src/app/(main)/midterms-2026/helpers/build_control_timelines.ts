import { ChoiceItem } from "@/types/choices";
import {
  MultipleChoiceAggregateForecast,
  QuestionWithMultipleChoiceForecasts,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";

export type ControlSeriesConfig = {
  /** Option labels whose probabilities are summed into this one series. */
  optionLabels: string[];
  /** Legend / tooltip label. */
  label: string;
  color: ThemeColor;
};

export type ControlTimeline = {
  timestamps: number[];
  choiceItems: ChoiceItem[];
};

/**
 * Builds a community-prediction timeline from a multiple-choice question,
 * summing one or more options into each series.
 *
 * Deliberately not built on `generateChoiceItemsFromMultipleChoiceForecast`:
 * that routes through `getAllOptionsHistory`, which returns only the *last*
 * entry of `question.options` when `options_history` is absent — so it can
 * silently collapse a four-option question to a single series. Summing has no
 * equivalent there either; the closest thing, `buildChoicesWithOthers`, only
 * folds *inactive* options into a gray bucket.
 *
 * Option indices are matched by label, case-insensitively — the same convention
 * `getMultipleChoiceOptionProbability` uses — so these are the same sums the
 * snapshot cards display and the two views cannot drift apart.
 *
 * Client-only: the timestamp grid compares `end_time` against the current
 * clock, so building this during SSR and again on the client would risk a
 * hydration mismatch.
 */
export function buildControlTimeline(
  question: QuestionWithMultipleChoiceForecasts | null | undefined,
  series: ControlSeriesConfig[]
): ControlTimeline | null {
  if (!question || !series.length) return null;

  const history =
    question.aggregations?.[question.default_aggregation_method]?.history;
  if (!history?.length) return null;

  const options = question.options ?? [];
  const seriesIndices = series.map((s) =>
    s.optionLabels.map((label) =>
      options.findIndex((o) => o.toLowerCase() === label.toLowerCase())
    )
  );
  // Fail closed, like the snapshot cards do: if an option label no longer
  // matches, we can't reproduce its number, and a silently understated line is
  // worse than no chart.
  if (seriesIndices.some((group) => group.some((i) => i < 0))) return null;

  const timestamps = collectTimestamps(history);
  // A single point can't draw a trend.
  if (timestamps.length < 2) return null;

  // Resolved once and shared by every series, rather than rescanning `history`
  // for each timestamp of each series.
  const coverage = mapTimestampsToForecasts(timestamps, history);

  const choiceItems: ChoiceItem[] = series.map((config, i) => {
    const optionIndices = seriesIndices[i] ?? [];
    const aggregationValues = coverage.map((entry) =>
      sumCenters(entry, optionIndices)
    );
    const aggregationForecasterCounts = coverage.map(
      (entry) => entry?.forecaster_count ?? 0
    );

    return {
      choice: config.label,
      label: config.label,
      color: config.color,
      highlighted: false,
      active: true,
      resolution: null,
      aggregationTimestamps: timestamps,
      aggregationValues,
      // No interval band: the CI around a sum of options is not the sum of
      // their CIs, so synthesizing one would be a fabrication. MultipleChoiceChart
      // never reads these anyway — its y1/y2 come from its own stacking pass.
      aggregationMinValues: timestamps.map(() => null),
      aggregationMaxValues: timestamps.map(() => null),
      aggregationForecasterCounts,
      userTimestamps: [],
      userValues: [],
    };
  });

  return { timestamps, choiceItems };
}

/**
 * Sorted, de-duplicated grid of every point where the aggregation changed.
 * `end_time` only counts once it's in the past, matching how the shared
 * `collectSortedTimestamps` treats still-open windows.
 */
function collectTimestamps(
  history: MultipleChoiceAggregateForecast[]
): number[] {
  const nowSeconds = Date.now() / 1000;
  const unique = new Set<number>();
  for (const forecast of history) {
    unique.add(forecast.start_time);
    if (forecast.end_time != null && forecast.end_time <= nowSeconds) {
      unique.add(forecast.end_time);
    }
  }
  return [...unique].sort((a, b) => a - b);
}

/**
 * The forecast window covering each timestamp, resolved in a single pass.
 *
 * Both sequences ascend — `timestamps` by construction, `history` sorted here —
 * so one monotonic cursor replaces a scan per timestamp per series. Assumes
 * non-overlapping aggregation windows, which is how CP history is built; were
 * they to overlap, this picks the latest-starting match rather than the first.
 * A timestamp no window covers maps to `undefined`, which `sumCenters` turns
 * into a null and the chart renders as a gap.
 */
function mapTimestampsToForecasts(
  timestamps: number[],
  history: MultipleChoiceAggregateForecast[]
): Array<MultipleChoiceAggregateForecast | undefined> {
  const sorted = [...history].sort((a, b) => a.start_time - b.start_time);
  let cursor = 0;

  return timestamps.map((timestamp) => {
    while (
      cursor + 1 < sorted.length &&
      (sorted[cursor + 1]?.start_time ?? Infinity) <= timestamp
    ) {
      cursor++;
    }
    const candidate = sorted[cursor];
    const covers =
      !!candidate &&
      candidate.start_time <= timestamp &&
      (candidate.end_time === null || candidate.end_time > timestamp);
    return covers ? candidate : undefined;
  });
}

/** Null if any contributing option is missing, so a gap stays a gap. */
function sumCenters(
  entry: MultipleChoiceAggregateForecast | undefined,
  optionIndices: number[]
): number | null {
  const centers = entry?.centers;
  if (!centers) return null;
  let total = 0;
  for (const index of optionIndices) {
    const value = centers[index];
    if (value == null) return null;
    total += value;
  }
  return Number(total.toFixed(6));
}
