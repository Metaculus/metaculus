import {
  AggregateForecast,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";
import { scaleInternalLocation } from "@/utils/math";

import { ValueRef } from "../../config/questions";
import {
  computeChange,
  findAggregateAt,
  getChangeSentiment,
  readForecastAt,
  readForecastPoint,
} from "../forecast_values";
import { formatChange, formatProbability, formatValue } from "../format";

function aggregate(
  startTime: number,
  endTime: number | null,
  centers: number[],
  bounds?: [number[], number[]]
): AggregateForecast {
  return {
    question_id: 1,
    start_time: startTime,
    end_time: endTime,
    forecast_values: [],
    interval_lower_bounds: bounds?.[0] ?? null,
    centers,
    interval_upper_bounds: bounds?.[1] ?? null,
    method: "recency_weighted",
    forecaster_count: 5,
    means: null,
    histogram: null,
  } as unknown as AggregateForecast;
}

function question(
  overrides: Partial<QuestionWithForecasts>,
  history: AggregateForecast[] = []
): QuestionWithForecasts {
  return {
    id: 1,
    type: QuestionType.Numeric,
    scaling: { range_min: 0, range_max: 100, zero_point: null },
    open_lower_bound: false,
    open_upper_bound: false,
    inbound_outcome_count: null,
    default_aggregation_method: "recency_weighted",
    aggregations: {
      recency_weighted: { history, latest: history.at(-1) },
    },
    ...overrides,
  } as unknown as QuestionWithForecasts;
}

const COUNT_REF: ValueRef = {
  postId: 1,
  label: "count",
  format: { kind: "count" },
};
const PROBABILITY_REF: ValueRef = {
  postId: 1,
  label: "probability",
  format: { kind: "probability" },
  tone: "higherIsWorse",
};

describe("findAggregateAt", () => {
  const history = [
    aggregate(100, 200, [0.1]),
    aggregate(200, 300, [0.2]),
    aggregate(400, null, [0.4]),
  ];

  it("returns the aggregate active at the timestamp", () => {
    expect(findAggregateAt(history, 250)?.centers).toEqual([0.2]);
  });

  it("keeps the last aggregate when forecasts lapsed before the timestamp", () => {
    expect(findAggregateAt(history, 350)?.centers).toEqual([0.2]);
  });

  it("returns null before the first forecast", () => {
    expect(findAggregateAt(history, 50)).toBeNull();
  });
});

describe("readForecastAt", () => {
  it("flags a lapsed community prediction", () => {
    const q = question({ type: QuestionType.Binary }, [
      aggregate(100, 200, [0.3]),
    ]);
    const result = readForecastAt(q, PROBABILITY_REF, 250);
    expect(result?.point.value).toBe(0.3);
    expect(result?.lapsed).toBe(true);
  });
});

describe("readForecastPoint", () => {
  it("reads binary probabilities", () => {
    const q = question({ type: QuestionType.Binary });
    const point = readForecastPoint(
      q,
      aggregate(0, null, [0.08], [[0.05], [0.12]]),
      PROBABILITY_REF
    );
    expect(point).toMatchObject({ value: 0.08, lower: 0.05, upper: 0.12 });
  });

  it("scales log-scaled numeric medians to real units", () => {
    const scaling = { range_min: 0, range_max: 10000, zero_point: -1000 };
    const q = question({ scaling });
    const point = readForecastPoint(
      q,
      aggregate(0, null, [0.7], [[0.56], [0.87]]),
      COUNT_REF
    );
    expect(point?.value).toBeCloseTo(scaleInternalLocation(0.7, scaling));
    expect(point?.lower).toBeCloseTo(scaleInternalLocation(0.56, scaling));
  });

  it("snaps discrete medians to the nearest outcome", () => {
    const q = question({
      type: QuestionType.Discrete,
      scaling: { range_min: 10.5, range_max: 100.5, zero_point: null },
      inbound_outcome_count: 90,
    });
    const point = readForecastPoint(q, aggregate(0, null, [0.5]), COUNT_REF);
    expect(point?.value).toBe(55);
  });

  it("flags medians above an open upper bound", () => {
    const q = question({
      scaling: { range_min: 200, range_max: 15000, zero_point: null },
      open_upper_bound: true,
    });
    const point = readForecastPoint(q, aggregate(0, null, [1]), COUNT_REF);
    expect(point).toMatchObject({ value: 15000, bound: "above" });
    expect(formatValue(COUNT_REF, point?.value ?? 0, point?.bound)).toBe(
      ">15,000"
    );
  });

  it("resolves the top multiple choice option and pinned options", () => {
    const q = question({
      type: QuestionType.MultipleChoice,
      options: ["Very High (or higher)", "High", "Moderate", "Low (or lower)"],
    } as Partial<QuestionWithForecasts>);
    const forecast = aggregate(0, null, [0.02, 0.19, 0.67, 0.12]);
    const ref: ValueRef = {
      postId: 1,
      option: "top",
      label: "top",
      format: { kind: "probability" },
    };
    expect(readForecastPoint(q, forecast, ref)).toMatchObject({
      option: "Moderate",
      value: 0.67,
    });
    expect(readForecastPoint(q, forecast, ref, "High")).toMatchObject({
      option: "High",
      value: 0.19,
    });
  });
});

describe("computeChange", () => {
  it("uses percentage points for probabilities", () => {
    const change = computeChange(PROBABILITY_REF, 0.08, 0.1);
    expect(change?.unit).toBe("pp");
    expect(change?.delta).toBeCloseTo(-2);
    expect(change?.direction).toBe("down");
  });

  it("uses relative change of the median for counts", () => {
    const change = computeChange(COUNT_REF, 4494, 3501);
    expect(change?.unit).toBe("percent");
    expect(change?.delta).toBeCloseTo(28.36, 1);
    expect(change?.direction).toBe("up");
  });

  it("treats small relative moves as steady", () => {
    expect(computeChange(COUNT_REF, 3284, 3435)?.direction).toBe("steady");
  });

  it("measures date shifts in days", () => {
    const ref: ValueRef = {
      postId: 1,
      label: "date",
      format: { kind: "date" },
    };
    const change = computeChange(ref, 86_400 * 12, 86_400 * 2);
    expect(change).toMatchObject({ delta: 10, unit: "days", direction: "up" });
  });

  it("does not let float noise hide a change at the threshold", () => {
    expect(computeChange(PROBABILITY_REF, 0.05, 0.06)?.direction).toBe("down");
  });

  it("returns null without a previous value", () => {
    expect(computeChange(COUNT_REF, 10, null)).toBeNull();
  });
});

describe("getChangeSentiment", () => {
  it("colors changes by tone", () => {
    expect(getChangeSentiment("higherIsWorse", "up")).toBe("worse");
    expect(getChangeSentiment("higherIsBetter", "up")).toBe("better");
    expect(getChangeSentiment("higherIsWorse", "down")).toBe("better");
    expect(getChangeSentiment("neutral", "up")).toBe("neutral");
    expect(getChangeSentiment("higherIsWorse", "steady")).toBe("neutral");
  });
});

describe("format", () => {
  it("formats probabilities like the monthly reports", () => {
    expect(formatProbability(0.0005)).toBe("<0.1%");
    expect(formatProbability(0.005)).toBe("0.5%");
    expect(formatProbability(0.1)).toBe("10%");
    expect(formatProbability(0.995)).toBe("99.5%");
    expect(formatProbability(0.672, 1)).toBe("67.2%");
  });

  it("formats changes with signs and units", () => {
    expect(
      formatChange({ delta: 28.36, unit: "percent", direction: "up" })
    ).toBe("+28%");
    expect(formatChange({ delta: -2, unit: "pp", direction: "down" })).toBe(
      "−2 pp"
    );
    expect(formatChange({ delta: 1, unit: "days", direction: "steady" })).toBe(
      "+1 day"
    );
    expect(
      formatChange({ delta: -0.16, unit: "percent", direction: "steady" })
    ).toBe("0%");
  });
});
