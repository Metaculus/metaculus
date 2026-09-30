import { PostWithForecasts } from "@/types/post";
import { AggregateForecast, QuestionType } from "@/types/question";

import { Edition } from "../../editions/types";
import { buildGhmSnapshot } from "../snapshot";

const AUG_28 = Date.parse("2026-08-28T12:00:00Z") / 1000;
const SEP_17 = Date.parse("2026-09-17T12:00:00Z") / 1000;
const NOW = Date.parse("2026-09-28T12:00:00Z") / 1000;

function aggregate(
  startTime: number,
  endTime: number | null,
  probability: number
): AggregateForecast {
  return {
    question_id: 45164,
    start_time: startTime,
    end_time: endTime,
    forecast_values: [1 - probability, probability],
    interval_lower_bounds: [probability],
    centers: [probability],
    interval_upper_bounds: [probability],
    method: "recency_weighted",
    forecaster_count: 12,
    means: null,
    histogram: null,
  } as unknown as AggregateForecast;
}

// Binary post behind the h5Pheic value key.
function h5Post(history: AggregateForecast[]): PostWithForecasts {
  return {
    id: 45011,
    title: "Will the WHO declare an H5 virus a PHEIC before 2028?",
    question: {
      id: 45164,
      type: QuestionType.Binary,
      label: "",
      resolution: null,
      scaling: { range_min: null, range_max: null, zero_point: null },
      default_aggregation_method: "recency_weighted",
      aggregations: {
        recency_weighted: { history, latest: history.at(-1) },
      },
    },
  } as unknown as PostWithForecasts;
}

const AUGUST: Edition = {
  slug: "2026-08",
  asOf: "2026-08-28T12:00:00Z",
  takeaways: [],
  sections: {},
  frozen: { h5Pheic: { value: 0.06 } },
};
const SEPTEMBER: Edition = {
  slug: "2026-09",
  asOf: "2026-09-17T12:00:00Z",
  takeaways: [],
  sections: {},
};

const HISTORY = [
  aggregate(AUG_28 - 86_400, SEP_17 - 86_400, 0.07),
  aggregate(SEP_17 - 86_400, null, 0.04),
];

describe("buildGhmSnapshot", () => {
  it("shows live values in the latest edition and compares with the previous frozen value", () => {
    const snapshot = buildGhmSnapshot(
      {
        posts: new Map([[45011, h5Post(HISTORY)]]),
        editions: [SEPTEMBER, AUGUST],
        edition: SEPTEMBER,
        previousEdition: AUGUST,
        isLatest: true,
        locale: "en",
      },
      NOW
    );
    const datum = snapshot.values.h5Pheic;

    expect(datum?.display).toBe("4%");
    expect(datum?.frozen).toBe(false);
    expect(datum?.change).toMatchObject({
      text: "−2 pp",
      direction: "down",
      sentiment: "better",
    });
    expect(snapshot.compareEdition?.label).toBe("August 2026");
    expect(snapshot.compareEdition?.shortLabel).toBe("August");
  });

  it("uses frozen values when viewing a past edition", () => {
    const snapshot = buildGhmSnapshot(
      {
        posts: new Map([[45011, h5Post(HISTORY)]]),
        editions: [SEPTEMBER, AUGUST],
        edition: AUGUST,
        previousEdition: null,
        isLatest: false,
        locale: "en",
      },
      NOW
    );

    expect(snapshot.values.h5Pheic).toMatchObject({
      display: "6%",
      frozen: true,
      change: null,
    });
    expect(snapshot.isLatest).toBe(false);
  });

  it("falls back to forecast history at the edition date without a frozen value", () => {
    const snapshot = buildGhmSnapshot(
      {
        posts: new Map([[45011, h5Post(HISTORY)]]),
        editions: [SEPTEMBER, AUGUST],
        edition: { ...AUGUST, frozen: {} },
        previousEdition: null,
        isLatest: false,
        locale: "en",
      },
      NOW
    );

    expect(snapshot.values.h5Pheic).toMatchObject({
      display: "7%",
      frozen: false,
    });
  });

  it("skips values whose post failed to load", () => {
    const snapshot = buildGhmSnapshot(
      {
        posts: new Map(),
        editions: [SEPTEMBER],
        edition: SEPTEMBER,
        previousEdition: null,
        isLatest: true,
        locale: "en",
      },
      NOW
    );

    expect(snapshot.values.h5Pheic).toBeUndefined();
  });
});
