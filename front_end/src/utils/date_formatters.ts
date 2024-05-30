import {
  differenceInMilliseconds,
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
