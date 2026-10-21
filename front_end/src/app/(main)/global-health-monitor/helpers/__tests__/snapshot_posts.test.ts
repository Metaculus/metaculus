import { cloneDeep } from "lodash";

import { PostStatus, PostWithForecasts, QuestionStatus } from "@/types/post";
import {
  AggregateForecast,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";

import { snapshotPostAt, snapshotPostsAt } from "../snapshot_posts";

const DAY = 86_400;
const AS_OF = Date.parse("2026-08-28T12:00:00Z") / 1000;

function iso(seconds: number) {
  return new Date(seconds * 1000).toISOString();
}

// API shape: history entries have no forecast values.
function aggregate(
  startTime: number,
  endTime: number | null,
  centers: (number | null)[]
): AggregateForecast {
  return {
    start_time: startTime,
    end_time: endTime,
    centers,
    interval_lower_bounds: centers,
    interval_upper_bounds: centers,
    forecaster_count: 10,
    method: "recency_weighted",
    means: null,
    histogram: null,
  } as unknown as AggregateForecast;
}

const HISTORY = [
  aggregate(AS_OF - 10 * DAY, AS_OF - DAY, [0.3]),
  aggregate(AS_OF - DAY, AS_OF + 5 * DAY, [0.4]),
  aggregate(AS_OF + 5 * DAY, null, [0.7]),
];

function question(
  overrides: Partial<QuestionWithForecasts> = {},
  history = HISTORY
): QuestionWithForecasts {
  return {
    id: 7,
    type: QuestionType.Binary,
    open_time: iso(AS_OF - 30 * DAY),
    scheduled_close_time: iso(AS_OF + 100 * DAY),
    actual_close_time: iso(AS_OF + 100 * DAY),
    resolution: null,
    status: QuestionStatus.OPEN,
    default_aggregation_method: "recency_weighted",
    aggregations: {
      recency_weighted: {
        history,
        latest: { ...history.at(-1), forecast_values: [0.3, 0.7] },
        movement: { direction: "up", movement: 0.3 },
      },
    },
    ...overrides,
  } as unknown as QuestionWithForecasts;
}

function questionPost(
  item: QuestionWithForecasts,
  overrides: Partial<PostWithForecasts> = {}
): PostWithForecasts {
  return {
    id: 1,
    title: "Question",
    status: PostStatus.OPEN,
    resolved: false,
    question: item,
    ...overrides,
  } as unknown as PostWithForecasts;
}

function snapshotQuestion(
  item: QuestionWithForecasts,
  distributions = {}
): QuestionWithForecasts {
  const snapshot = snapshotPostAt(questionPost(item), AS_OF, distributions);
  return snapshot.question as QuestionWithForecasts;
}

function aggregation(item: QuestionWithForecasts) {
  return item.aggregations.recency_weighted;
}

describe("snapshotPostAt", () => {
  it("cuts history at asOf and shows the Community Prediction then", () => {
    const snapshot = aggregation(snapshotQuestion(question()));

    expect(snapshot.history.map((entry) => entry.centers)).toEqual([
      [0.3],
      [0.4],
    ]);
    expect(snapshot.history.at(-1)?.end_time).toBeNull();
    expect(snapshot.latest).toMatchObject({
      centers: [0.4],
      end_time: null,
      forecast_values: [0.6, 0.4],
    });
    expect(snapshot.movement).toBeNull();
  });

  it("pins timelines to asOf and keeps the question open", () => {
    const post = snapshotPostAt(questionPost(question()), AS_OF, {});

    expect(post.question?.actual_close_time).toBe(iso(AS_OF));
    expect(post.question?.status).toBe(QuestionStatus.OPEN);
    expect(post.status).toBe(PostStatus.OPEN);
  });

  it("draws continuous questions from the baked distribution", () => {
    const snapshot = snapshotQuestion(
      question({ type: QuestionType.Numeric }),
      { 7: { postId: 1, cdf: [0, 0.5, 1] } }
    );

    expect(aggregation(snapshot).latest).toMatchObject({
      forecast_values: [0, 0.5, 1],
      end_time: null,
    });
  });

  it("ends a continuous aggregate at asOf without a baked distribution", () => {
    const snapshot = snapshotQuestion(question({ type: QuestionType.Numeric }));

    expect(aggregation(snapshot).latest).toMatchObject({
      forecast_values: null,
      end_time: AS_OF,
    });
  });

  it("uses option probabilities for multiple choice", () => {
    const snapshot = snapshotQuestion(
      question({ type: QuestionType.MultipleChoice } as never, [
        aggregate(AS_OF - DAY, null, [0.2, null, 0.8]),
      ])
    );

    expect(aggregation(snapshot).latest?.forecast_values).toEqual([
      0.2, 0, 0.8,
    ]);
  });

  it("reopens a question that closed and resolved after asOf", () => {
    const post = snapshotPostAt(
      questionPost(
        question({
          resolution: "yes",
          resolution_set_time: iso(AS_OF + 3 * DAY),
          actual_resolve_time: iso(AS_OF + 3 * DAY),
          actual_close_time: iso(AS_OF + 2 * DAY),
          status: QuestionStatus.RESOLVED,
        }),
        { status: PostStatus.RESOLVED, resolved: true }
      ),
      AS_OF,
      {}
    );

    expect(post.question).toMatchObject({
      resolution: null,
      actual_resolve_time: undefined,
      status: QuestionStatus.OPEN,
    });
    expect(post.status).toBe(PostStatus.OPEN);
    expect(post.resolved).toBe(false);
  });

  it("keeps a resolution known at asOf", () => {
    const snapshot = snapshotQuestion(
      question({
        resolution: "no",
        resolution_set_time: iso(AS_OF - DAY),
        actual_close_time: iso(AS_OF - 2 * DAY),
        status: QuestionStatus.RESOLVED,
      })
    );

    expect(snapshot).toMatchObject({
      resolution: "no",
      status: QuestionStatus.RESOLVED,
      actual_close_time: iso(AS_OF - 2 * DAY),
    });
  });

  it("marks a question closed before asOf as closed", () => {
    const snapshot = snapshotQuestion(
      question({ actual_close_time: iso(AS_OF - DAY) })
    );

    expect(snapshot.status).toBe(QuestionStatus.CLOSED);
  });

  it("hides forecasts of a question that opened after asOf", () => {
    const post = snapshotPostAt(
      questionPost(question({ open_time: iso(AS_OF + DAY) })),
      AS_OF,
      {}
    );

    expect(post.question?.status).toBe(QuestionStatus.UPCOMING);
    expect(aggregation(post.question as QuestionWithForecasts)).toMatchObject({
      history: [],
      latest: undefined,
    });
    expect(post.status).toBe(PostStatus.APPROVED);
  });

  it("snapshots every question of a group", () => {
    const group = {
      id: 2,
      title: "Group",
      status: PostStatus.OPEN,
      resolved: false,
      group_of_questions: {
        questions: [
          question({ id: 8, actual_close_time: iso(AS_OF - DAY) }),
          question({ id: 9 }),
        ],
      },
    } as unknown as PostWithForecasts;

    const post = snapshotPostAt(group, AS_OF, {});

    expect(
      post.group_of_questions?.questions.map((item) => item.status)
    ).toEqual([QuestionStatus.CLOSED, QuestionStatus.OPEN]);
    expect(post.status).toBe(PostStatus.OPEN);
  });

  it("leaves the input untouched", () => {
    const post = questionPost(question({ type: QuestionType.Numeric }));
    const before = cloneDeep(post);

    snapshotPostsAt(new Map([[1, post]]), AS_OF, {
      7: { postId: 1, cdf: [0, 1] },
    });

    expect(post).toEqual(before);
  });
});
