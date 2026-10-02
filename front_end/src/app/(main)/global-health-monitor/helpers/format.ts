import { isNil } from "lodash";

import { ChangeDirection, ForecastChange, ValueBound } from "./forecast_values";
import { ValueFormat, ValueRef } from "../config/questions";

// Token text sits inside English editorial prose, so numbers are always formatted in en-US.
const PROSE_LOCALE = "en-US";
const MINUS = "−";

function trimZeros(value: string) {
  return value.includes(".") ? value.replace(/\.?0+$/, "") : value;
}

export function formatProbability(probability: number, decimals?: number) {
  const percent = probability * 100;
  if (percent < 0.1) {
    return "<0.1%";
  }
  if (percent > 99.9) {
    return ">99.9%";
  }
  if (!isNil(decimals)) {
    return `${percent.toFixed(decimals)}%`;
  }
  if (percent < 1 || percent > 99) {
    return `${trimZeros(percent.toFixed(1))}%`;
  }
  return `${Math.round(percent)}%`;
}

function formatNumber(value: number, decimals: number) {
  return new Intl.NumberFormat(PROSE_LOCALE, {
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDateValue(
  timestampSeconds: number,
  granularity: ValueFormat["granularity"] = "day",
  locale = PROSE_LOCALE
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    year: "numeric",
    month: granularity === "month" ? "long" : "short",
    ...(granularity === "month" ? {} : { day: "numeric" }),
  }).format(new Date(timestampSeconds * 1000));
}

function getKind(ref: ValueRef): ValueFormat["kind"] {
  return ref.mode === "pAbove" || ref.mode === "pBelow"
    ? "probability"
    : ref.format.kind;
}

export function formatPlainValue(ref: ValueRef, value: number) {
  const { decimals, granularity } = ref.format;
  switch (getKind(ref)) {
    case "probability":
      return formatProbability(value, decimals);
    case "percent":
      return `${trimZeros(value.toFixed(decimals ?? 1))}%`;
    case "rate":
      return formatNumber(value, decimals ?? 1);
    case "date":
      return formatDateValue(value, granularity);
    default:
      return formatNumber(value, decimals ?? 0);
  }
}

export function formatValue(
  ref: ValueRef,
  value: number,
  bound: ValueBound = null
) {
  const prefix = bound === "above" ? ">" : bound === "below" ? "<" : "";
  return `${prefix}${formatPlainValue(ref, value)}`;
}

export function formatInterval(
  ref: ValueRef,
  lower: number | null,
  upper: number | null
) {
  if (isNil(lower) || isNil(upper) || getKind(ref) === "probability") {
    return null;
  }
  return `${formatPlainValue(ref, lower)} – ${formatPlainValue(ref, upper)}`;
}

function formatChangeMagnitude(change: ForecastChange) {
  const magnitude = Math.abs(change.delta);
  switch (change.unit) {
    case "pp":
      return {
        amount: trimZeros(magnitude.toFixed(magnitude < 10 ? 1 : 0)),
        suffix: " pp",
      };
    case "percent":
      return { amount: String(Math.round(magnitude)), suffix: "%" };
    case "days": {
      const days = Math.round(magnitude);
      return { amount: String(days), suffix: days === 1 ? " day" : " days" };
    }
    default:
      return { amount: formatNumber(magnitude, 1), suffix: "" };
  }
}

export function formatChange(change: ForecastChange) {
  const { amount, suffix } = formatChangeMagnitude(change);
  const isZero = Number(amount.replace(/,/g, "")) === 0;
  const sign = isZero ? "" : change.delta > 0 ? "+" : MINUS;
  return `${sign}${amount}${suffix}`;
}

export function formatInlineChange(
  change: { text: string; direction: ChangeDirection },
  since: string
) {
  return change.direction === "steady"
    ? `steady since ${since}`
    : `${change.text} since ${since}`;
}

export function formatInlineInterval(interval: string) {
  return `50% prediction interval: ${interval}`;
}

// Edition slugs are YYYY-MM months.
function editionMonth(slug: string) {
  return new Date(`${slug}-01T00:00:00Z`);
}

export function formatEditionLabel(slug: string, locale = PROSE_LOCALE) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(editionMonth(slug));
}

// Month name for English prose, e.g. "+29% since August".
export function formatEditionMonth(slug: string) {
  return new Intl.DateTimeFormat(PROSE_LOCALE, {
    timeZone: "UTC",
    month: "long",
  }).format(editionMonth(slug));
}

// Source and comment dates (YYYY-MM-DD).
export function formatIsoDate(date: string, locale = PROSE_LOCALE) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatTimestamp(timestampSeconds: number, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestampSeconds * 1000));
}
