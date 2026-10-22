import { isNil } from "lodash";

import { PostStatus, PostWithForecasts, QuestionStatus } from "@/types/post";
import {
  AggregateForecast,
  AggregateForecastHistory,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";

// Community Prediction CDFs keyed by question ID. Forecast history has none.
type Distributions = Record<number, number[]>;

const POST_STATUS: Record<QuestionStatus, PostStatus> = {
  [QuestionStatus.UPCOMING]: PostStatus.APPROVED,
  [QuestionStatus.OPEN]: PostStatus.OPEN,
  [QuestionStatus.CLOSED]: PostStatus.CLOSED,
  [QuestionStatus.RESOLVED]: PostStatus.RESOLVED,
};

function toSeconds(iso: string | null | undefined): number | null {
  return iso ? Math.floor(Date.parse(iso) / 1000) : null;
}

function earliest(...times: (number | null)[]): number | null {
  const defined = times.filter((time): time is number => !isNil(time));
  return defined.length ? Math.min(...defined) : null;
}

// History entries carry no forecast values, but the shared cards read them from `latest`.
function getForecastValues(
  question: QuestionWithForecasts,
  aggregate: AggregateForecast,
  distributions: Distributions
): number[] | null {
  switch (question.type) {
    case QuestionType.Binary: {
      const center = aggregate.centers?.[0];
      return isNil(center) ? null : [1 - center, center];
    }
    case QuestionType.MultipleChoice:
      // Multiple choice centers are the normalised option probabilities; null marks an
      // option that didn't exist yet.
      return aggregate.centers?.map((center) => center ?? 0) ?? null;
    default:
      return distributions[question.id] ?? null;
  }
}

function snapshotAggregation(
  question: QuestionWithForecasts,
  aggregation: AggregateForecastHistory,
  asOf: number,
  distributions: Distributions
): AggregateForecastHistory {
  const history = aggregation.history
    .filter((aggregate) => aggregate.start_time <= asOf)
    .map((aggregate) =>
      isNil(aggregate.end_time) || aggregate.end_time > asOf
        ? { ...aggregate, end_time: null }
        : aggregate
    );
  const last = history.at(-1);
  if (!last) {
    return { ...aggregation, history, latest: undefined, movement: null };
  }

  const forecastValues = getForecastValues(question, last, distributions);
  return {
    ...aggregation,
    history,
    latest: {
      ...last,
      forecast_values: forecastValues,
      means: null,
      histogram: null,
      // A live continuous aggregate without its distribution breaks the shared charts, so it
      // ends at asOf instead and they skip the curve.
      end_time:
        isNil(forecastValues) && isNil(last.end_time) ? asOf : last.end_time,
    },
    movement: null,
  } as AggregateForecastHistory;
}

function snapshotQuestion<Q extends QuestionWithForecasts>(
  question: Q,
  asOf: number,
  distributions: Distributions
): Q {
  const openTime = toSeconds(question.open_time);
  const revealTime = toSeconds(question.cp_reveal_time);
  const resolvedAt = toSeconds(
    question.resolution_set_time ?? question.actual_resolve_time
  );
  const closeTime = earliest(
    toSeconds(question.scheduled_close_time),
    toSeconds(question.actual_close_time)
  );

  const isUpcoming = isNil(openTime) || openTime > asOf;
  const isCpHidden = isUpcoming || (!isNil(revealTime) && revealTime > asOf);
  const isResolved =
    !isNil(question.resolution) && (isNil(resolvedAt) || resolvedAt <= asOf);
  const status = isUpcoming
    ? QuestionStatus.UPCOMING
    : isResolved
      ? QuestionStatus.RESOLVED
      : !isNil(closeTime) && closeTime <= asOf
        ? QuestionStatus.CLOSED
        : QuestionStatus.OPEN;

  const aggregations = Object.fromEntries(
    Object.entries(question.aggregations).map(([method, aggregation]) => [
      method,
      aggregation &&
        (isCpHidden
          ? { ...aggregation, history: [], latest: undefined, movement: null }
          : snapshotAggregation(question, aggregation, asOf, distributions)),
    ])
  );

  return {
    ...question,
    aggregations,
    resolution: isResolved ? question.resolution : null,
    actual_resolve_time: isResolved ? question.actual_resolve_time : undefined,
    resolution_set_time: isResolved ? question.resolution_set_time : undefined,
    // Timelines end at the close time, so this pins them to asOf.
    actual_close_time: new Date(
      (earliest(toSeconds(question.actual_close_time), asOf) ?? asOf) * 1000
    ).toISOString(),
    status,
    my_forecasts: undefined,
  } as Q;
}

function getGroupStatus(statuses: QuestionStatus[]): QuestionStatus {
  if (statuses.every((status) => status === QuestionStatus.RESOLVED)) {
    return QuestionStatus.RESOLVED;
  }
  if (statuses.includes(QuestionStatus.OPEN)) {
    return QuestionStatus.OPEN;
  }
  if (statuses.every((status) => status === QuestionStatus.UPCOMING)) {
    return QuestionStatus.UPCOMING;
  }
  return QuestionStatus.CLOSED;
}

/**
 * The post as it stood at `asOf` (seconds): forecast history cut off there, the Community
 * Prediction then as `latest`, and resolution and status as they were. Never mutates `post`.
 */
export function snapshotPostAt(
  post: PostWithForecasts,
  asOf: number,
  distributions: Distributions
): PostWithForecasts {
  if (post.question) {
    const question = snapshotQuestion(post.question, asOf, distributions);
    const status = question.status ?? QuestionStatus.OPEN;
    return {
      ...post,
      question,
      status: POST_STATUS[status],
      resolved: status === QuestionStatus.RESOLVED,
    };
  }

  if (post.group_of_questions) {
    const questions = post.group_of_questions.questions.map((question) =>
      snapshotQuestion(question, asOf, distributions)
    );
    const status = getGroupStatus(
      questions.map((question) => question.status ?? QuestionStatus.OPEN)
    );
    return {
      ...post,
      group_of_questions: { ...post.group_of_questions, questions },
      status: POST_STATUS[status],
      resolved: status === QuestionStatus.RESOLVED,
    };
  }

  return post;
}

function getQuestions(post: PostWithForecasts): QuestionWithForecasts[] {
  return post.question
    ? [post.question]
    : post.group_of_questions?.questions ?? [];
}

// Whether any of the post's questions had opened by `asOf` (seconds).
export function hadOpenedBy(post: PostWithForecasts, asOf: number): boolean {
  return getQuestions(post).some((question) => {
    const openTime = toSeconds(question.open_time);
    return !isNil(openTime) && openTime <= asOf;
  });
}

export function snapshotPostsAt(
  posts: Map<number, PostWithForecasts>,
  asOf: number,
  distributions: Distributions
): Map<number, PostWithForecasts> {
  return new Map(
    [...posts].map(([id, post]) => [
      id,
      snapshotPostAt(post, asOf, distributions),
    ])
  );
}
