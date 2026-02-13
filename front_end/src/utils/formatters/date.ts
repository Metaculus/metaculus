import {
  differenceInMilliseconds,
  Duration,
  intlFormat,
  intlFormatDistance,
} from "date-fns";
import { es, cs, pt, zhTW, zhCN, enUS } from "date-fns/locale";

export const DURATION_KEYS = [
  "years",
  "months",
  "weeks",
  "days",
  "hours",
  "minutes",
  "seconds",
] as const;

export type DurationKey = (typeof DURATION_KEYS)[number];

const UNIT_MS: Record<DurationKey, number> = {
  seconds: 1_000,
  minutes: 60_000,
  hours: 3_600_000,
  days: 86_400_000,
  weeks: 604_800_000,
  months: 2_592_000_000,
  years: 31_536_000_000,
} as const;

type RelativeBucket = {
  key: Exclude<DurationKey, "seconds">;
  n: number;
  unit: "minute" | "hour" | "day" | "week" | "month" | "year";
};

export function bucketRelativeMs(
  deltaMs: number
):
  | { kind: "soon" }
  | { kind: "underMinute" }
  | { kind: "farFuture" }
  | { kind: "bucket"; value: RelativeBucket } {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return { kind: "soon" };
  if (deltaMs > 20 * UNIT_MS.years) return { kind: "farFuture" };
  if (deltaMs < UNIT_MS.minutes) return { kind: "underMinute" };

  const keys: RelativeBucket["key"][] = [
    "minutes",
    "hours",
    "days",
    "weeks",
    "months",
    "years",
  ];

  for (const key of keys) {
    const unitMs = UNIT_MS[key];
    const nextKey = keys[keys.indexOf(key) + 1];
    const upper = nextKey ? UNIT_MS[nextKey] : Infinity;

    if (deltaMs < upper) {
      const n = Math.round(deltaMs / unitMs);
      return {
        kind: "bucket",
        value: {
          key,
          n,
          unit: key.replace(/s$/, "") as RelativeBucket["unit"],
        },
      };
    }
  }

  return {
    kind: "bucket",
    value: {
      key: "years",
      n: Math.round(deltaMs / UNIT_MS.years),
      unit: "year",
    },
  };
}

export function safeTs(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

export function formatDate(locale: string, date: Date) {
  return intlFormat(
    new Date(date),
    { year: "numeric", month: "short", day: "numeric" },
    { locale }
  );
}

export function formatDatetime(locale: string, date: Date) {
  return intlFormat(
    new Date(date),
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    },
    { locale }
  );
}

type RelativeDateParams = {
  now?: Date;
  short?: boolean;
  relCutoff?: number;
  absPrefix?: string;
};
export function formatRelativeDate(
  locale: string,
  date: Date,
  params?: RelativeDateParams
) {
  const {
    now = new Date(),
    short = true,
    relCutoff = 7 * 8.64e7, // 7 days
    absPrefix = "",
  } = params ?? {};

  const delta = differenceInMilliseconds(date, now);

  let dateStr: string = "";
  if (Math.abs(delta) < relCutoff) {
    dateStr = intlFormatDistance(date, now, {
      locale,
      numeric: "always",
      style: short ? "short" : "long",
    });
  } else if (short) {
    dateStr = absPrefix + formatDate(locale, date);
  } else {
    dateStr = absPrefix + formatDatetime(locale, date);
  }
  return dateStr;
}

export const truncateDuration = (
  duration: Duration,
  truncateNumUnits = 1
): Duration => {
  const truncated: Duration = {};
  let numUnits = 0;

  for (const key of DURATION_KEYS) {
    if (duration[key] && numUnits < truncateNumUnits) {
      numUnits++;
      truncated[key] = duration[key];
    }
    if (numUnits >= truncateNumUnits) return truncated;
  }

  return duration;
};

export function formatDurationToShortStr(duration: Duration): string {
  let str = "";
  if (duration.years) {
    str += duration.years + "y";
  }
  if (duration.months) {
    str += duration.months + "mo";
  }
  if (duration.weeks) {
    str += duration.weeks + "w";
  }
  if (duration.days) {
    str += duration.days + "d";
  }
  if (duration.hours) {
    str += duration.hours + "h";
  }
  if (duration.minutes) {
    str += duration.minutes + "m";
  }
  if (duration.seconds) {
    str += duration.seconds + "s";
  }
  return str;
}

export const getDateFnsLocale = (locale: string) => {
  switch (locale) {
    case "es":
      return es;
    case "cs":
      return cs;
    case "pt":
      return pt;
    case "zh-TW":
      return zhTW;
    case "zh":
      return zhCN;
    default:
      return enUS;
  }
};
