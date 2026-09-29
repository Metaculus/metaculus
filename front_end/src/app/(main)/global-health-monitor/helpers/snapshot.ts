import { isNil } from "lodash";

import { PostWithForecasts } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import { lttb } from "@/utils/charts/lttb";
import { formatResolution } from "@/utils/formatters/resolution";

import {
  ChangeDirection,
  ChangeSentiment,
  ForecastPoint,
  computeChange,
  findQuestion,
  getChangeSentiment,
  readForecastAt,
  readHistorySeries,
  readLatestForecast,
} from "./forecast_values";
import {
  editionDate,
  formatChange,
  formatEditionDate,
  formatInterval,
  formatValue,
} from "./format";
import {
  GHM_VALUE_KEYS,
  GHM_VALUES,
  GhmValueKey,
  ValueRef,
} from "../config/questions";
import { Edition } from "../editions/types";

const SPARKLINE_POINTS = 40;

export type TokenChange = {
  text: string;
  direction: ChangeDirection;
  sentiment: ChangeSentiment;
};

export type TokenDatum = {
  key: GhmValueKey;
  postId: number;
  title: string;
  subtitle: string | null;
  value: number | null;
  display: string | null;
  interval: string | null;
  change: TokenChange | null;
  // Start (seconds) of the aggregate the value comes from.
  asOf: number | null;
  // End (seconds) of the latest aggregate when forecasts have lapsed.
  lapsedSince: number | null;
  frozen: boolean;
  resolution: { display: string; forecastWas: string | null } | null;
  sparkline: [number, number][];
};

export type EditionLabel = {
  slug: string;
  label: string;
  shortLabel: string;
};

export type EditionMarker = EditionLabel & { timestamp: number };

export type GhmSnapshot = {
  values: Partial<Record<GhmValueKey, TokenDatum>>;
  edition: EditionLabel;
  compareEdition: EditionLabel | null;
  isLatest: boolean;
  editionMarkers: EditionMarker[];
};

type BuildParams = {
  posts: Map<number, PostWithForecasts>;
  editions: Edition[];
  edition: Edition;
  previousEdition: Edition | null;
  isLatest: boolean;
  locale: string;
};

type BuildContext = BuildParams & { nowSeconds: number };

function toSeconds(iso: string) {
  return Math.floor(Date.parse(iso) / 1000);
}

function getEditionLabel(edition: Edition, locale: string): EditionLabel {
  return {
    slug: edition.slug,
    label: formatEditionDate(edition.slug, locale),
    shortLabel: formatEditionDate(edition.slug, "en-US", false),
  };
}

function frozenPoint(edition: Edition, key: GhmValueKey): ForecastPoint | null {
  const frozen = edition.frozen?.[key];
  if (!frozen || isNil(frozen.value)) {
    return null;
  }
  const timestamp = toSeconds(edition.asOf);
  return {
    value: frozen.value,
    lower: frozen.lower ?? null,
    upper: frozen.upper ?? null,
    bound: frozen.bound ?? null,
    option: frozen.option ?? null,
    startTime: timestamp,
    endTime: null,
  };
}

function readEditionPoint(
  question: QuestionWithForecasts,
  ref: ValueRef,
  edition: Edition,
  key: GhmValueKey,
  option?: string | null
): { point: ForecastPoint; frozen: boolean; lapsed: boolean } | null {
  const frozen = frozenPoint(edition, key);
  const optionMatches =
    ref.option !== "top" || !option || frozen?.option === option;
  if (frozen && optionMatches) {
    return { point: frozen, frozen: true, lapsed: false };
  }
  const historical = readForecastAt(
    question,
    ref,
    toSeconds(edition.asOf),
    option
  );
  return historical
    ? { point: historical.point, frozen: false, lapsed: historical.lapsed }
    : null;
}

function formatDisplay(ref: ValueRef, point: ForecastPoint) {
  const value = formatValue(ref, point.value, point.bound);
  return ref.option === "top" && point.option
    ? `${point.option} (${value})`
    : value;
}

function readResolution(
  question: QuestionWithForecasts,
  ref: ValueRef,
  locale: string
): TokenDatum["resolution"] {
  if (isNil(question.resolution)) {
    return null;
  }
  const closeTime = question.actual_close_time ?? question.scheduled_close_time;
  const atClose = closeTime
    ? readForecastAt(question, ref, toSeconds(closeTime))
    : null;
  return {
    display: formatResolution({
      resolution: question.resolution,
      questionType: question.type,
      locale,
      actual_resolve_time: question.actual_resolve_time ?? null,
      scaling: question.scaling,
      unit: question.unit,
    }),
    forecastWas: atClose ? formatDisplay(ref, atClose.point) : null,
  };
}

function buildDatum(
  key: GhmValueKey,
  post: PostWithForecasts,
  question: QuestionWithForecasts,
  context: BuildContext
): TokenDatum {
  const ref: ValueRef = GHM_VALUES[key];
  const { edition, previousEdition, isLatest, locale, nowSeconds } = context;

  let point: ForecastPoint | null;
  let frozen = false;
  let lapsedSince: number | null = null;

  if (isLatest) {
    point = readLatestForecast(question, ref);
    if (point && !isNil(point.endTime) && point.endTime <= nowSeconds) {
      lapsedSince = point.endTime;
    }
  } else {
    const atEdition = readEditionPoint(question, ref, edition, key);
    point = atEdition?.point ?? null;
    frozen = atEdition?.frozen ?? false;
    if (atEdition?.lapsed && point && !isNil(point.endTime)) {
      lapsedSince = point.endTime;
    }
  }

  const previous =
    previousEdition && point
      ? readEditionPoint(question, ref, previousEdition, key, point.option)
      : null;
  const change = computeChange(ref, point?.value, previous?.point.value);

  const series = lttb(
    readHistorySeries(question, ref, point?.option ?? null),
    SPARKLINE_POINTS
  );

  return {
    key,
    postId: post.id,
    title: post.title,
    subtitle: ref.subQuestionId ? question.label : point?.option ?? null,
    value: point?.value ?? null,
    display: point ? formatDisplay(ref, point) : null,
    interval: point ? formatInterval(ref, point.lower, point.upper) : null,
    change: change
      ? {
          text: formatChange(change),
          direction: change.direction,
          sentiment: getChangeSentiment(ref.tone, change.direction),
        }
      : null,
    asOf: point?.startTime ?? null,
    lapsedSince,
    frozen,
    resolution: isLatest ? readResolution(question, ref, locale) : null,
    sparkline: series.map(({ x, y }) => [x, y] as [number, number]),
  };
}

export function buildGhmSnapshot(
  params: BuildParams,
  nowSeconds = Math.floor(Date.now() / 1000)
): GhmSnapshot {
  const { posts, editions, edition, previousEdition, isLatest, locale } =
    params;
  const context: BuildContext = { ...params, nowSeconds };
  const values: GhmSnapshot["values"] = {};

  for (const key of GHM_VALUE_KEYS) {
    const ref: ValueRef = GHM_VALUES[key];
    const post = posts.get(ref.postId);
    const question = findQuestion(post, ref);
    if (post && question) {
      values[key] = buildDatum(key, post, question, context);
    }
  }

  return {
    values,
    edition: getEditionLabel(edition, locale),
    compareEdition: previousEdition
      ? getEditionLabel(previousEdition, locale)
      : null,
    isLatest,
    editionMarkers: editions.map((item) => ({
      ...getEditionLabel(item, locale),
      timestamp: Math.floor(editionDate(item.slug).getTime() / 1000),
    })),
  };
}
