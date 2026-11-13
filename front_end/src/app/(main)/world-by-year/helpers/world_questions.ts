import { Scaling } from "@/types/question";
import {
  computeQuartilesFromCDF,
  getCdfAt,
  scaleInternalLocation,
} from "@/utils/math";

import {
  DENSITY_STEPS,
  interpolate,
  LIKELY_THRESHOLD,
  timestampToYear,
  YEAR_MAX,
  YEAR_MIN,
  yearToTimestamp,
} from "./forecast";
import { AREA_SECTIONS } from "../data/area_sections";
import {
  CuratedQuestion,
  WorldForecast,
  WorldQuestion,
} from "../data/questions";

// Rounded so a percentile that sits exactly on a year or month boundary is
// not pushed across it by floating-point error.
const YEAR_PRECISION = 1e4;
const DENSITY_PRECISION = 1e4;

const round = (value: number, precision: number) =>
  Math.round(value * precision) / precision;

// Density per year across the chart: each CDF step's share over its width in
// time, joined through the step centres.
const sampleDensity = (cdf: number[], scaling: Scaling) => {
  const edges = cdf.map((_, i) =>
    timestampToYear(scaleInternalLocation(i / (cdf.length - 1), scaling))
  );
  const centers: number[] = [];
  const rates: number[] = [];
  for (let i = 1; i < cdf.length; i++) {
    const from = edges[i - 1] as number;
    const to = edges[i] as number;
    centers.push((from + to) / 2);
    rates.push(((cdf[i] as number) - (cdf[i - 1] as number)) / (to - from));
  }
  const rangeStart = edges[0] as number;
  const rangeEnd = edges[edges.length - 1] as number;
  const values = Array.from({ length: DENSITY_STEPS + 1 }, (_, i) => {
    const year = YEAR_MIN + ((YEAR_MAX + 1 - YEAR_MIN) * i) / DENSITY_STEPS;
    return year < rangeStart || year > rangeEnd
      ? 0
      : interpolate(year, centers, rates);
  });
  const peak = Math.max(...values);
  return values.map((value) =>
    peak > 0 ? round(value / peak, DENSITY_PRECISION) : 0
  );
};

const summarize = ({ cdf, scaling, forecasters }: WorldForecast) => {
  const reached = cdf.at(-1) ?? 0;
  // The page places a question by its median, so the median has to fall
  // inside the question's range.
  if (
    cdf.length < 2 ||
    scaling.range_min == null ||
    scaling.range_max == null ||
    !Number.isFinite(scaling.range_min) ||
    !Number.isFinite(scaling.range_max) ||
    scaling.range_max <= scaling.range_min ||
    !Number.isFinite(forecasters) ||
    forecasters < 0 ||
    cdf.some(
      (value, i) =>
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1 ||
        (i > 0 && value < (cdf[i - 1] as number))
    ) ||
    reached < 0.5
  ) {
    return null;
  }

  const quartiles = computeQuartilesFromCDF(cdf, true);
  const toYear = (location: number, share: number) =>
    share > reached
      ? Infinity
      : round(
          timestampToYear(scaleInternalLocation(location, scaling)),
          YEAR_PRECISION
        );
  const probabilityByYearEnd = Array.from(
    { length: YEAR_MAX - YEAR_MIN + 1 },
    (_, i) => getCdfAt(yearToTimestamp(YEAR_MIN + i + 1), cdf, scaling) ?? 0
  );
  const firstLikely = probabilityByYearEnd.findIndex(
    (probability) => probability >= LIKELY_THRESHOLD
  );
  const median = toYear(quartiles.median, 0.5);
  const p10 = toYear(quartiles.lower10, 0.1);
  const p25 = toYear(quartiles.lower25, 0.25);
  const p75 = toYear(quartiles.upper75, 0.75);
  const p90 = toYear(quartiles.upper90, 0.9);
  const density = sampleDensity(cdf, scaling);

  if (
    ![median, p10, p25].every(Number.isFinite) ||
    [p75, p90].some(Number.isNaN) ||
    probabilityByYearEnd.some((probability) => !Number.isFinite(probability)) ||
    density.some((value) => !Number.isFinite(value))
  ) {
    return null;
  }

  return {
    forecasters,
    median,
    p10,
    p25,
    p75,
    p90,
    probabilityByYearEnd,
    firstLikelyYear: firstLikely < 0 ? null : YEAR_MIN + firstLikely,
    density,
  };
};

// A question without copy or a usable forecast is left off the page.
export const buildWorldQuestions = (
  curated: CuratedQuestion[],
  forecasts: Record<string, WorldForecast | undefined>
): WorldQuestion[] =>
  curated.flatMap((question) => {
    const forecast = forecasts[question.id];
    const summary = forecast && summarize(forecast);
    const hasCopy = !!AREA_SECTIONS[question.area].questions[question.id];
    return summary && hasCopy ? [{ ...question, ...summary }] : [];
  });
