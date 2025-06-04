import {
  differenceInMilliseconds,
  Duration,
  intlFormat,
  intlFormatDistance,
} from "date-fns";

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
  truncateNumUnits: number = 1
): Duration => {
  const truncatedDuration: Duration = {};
  let numUnits = 0;
  for (const key of [
    "years",
    "months",
    "weeks",
    "days",
    "hours",
    "minutes",
    "seconds",
  ]) {
    if (duration[key as keyof Duration] && numUnits < truncateNumUnits) {
      numUnits++;
      truncatedDuration[key as keyof Duration] =
        duration[key as keyof Duration];
    }

    if (numUnits >= truncateNumUnits) {
      return truncatedDuration;
    }
  }
  return duration;
};

export function formatDurationToShortStr(duration: Duration): string {
  let str = "";
  if (duration.years) {
    str += duration.years + "y";
  }
  if (duration.months) {
    str += duration.months + "m";
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
