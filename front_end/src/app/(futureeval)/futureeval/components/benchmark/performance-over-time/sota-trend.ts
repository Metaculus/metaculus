import type { LeaderboardDetails } from "@/types/scoring";

import { getBots, type MappedBots } from "./mapping";

/**
 * A point with timestamp (x) and score (y)
 */
export type TrendPoint = { x: number; y: number };

/**
 * Linear regression result with slope and intercept
 */
export type LinearRegression = {
  slope: number;
  intercept: number;
};

/**
 * Result of calculating when SOTA trend crosses a threshold
 */
export type SotaCrossingResult = {
  /** The timestamp when crossing occurs (null if trend never reaches threshold) */
  crossingTimestamp: number | null;
  /** The crossing point as a Date (null if trend never reaches threshold) */
  crossingDate: Date | null;
  /** Whether the crossing is in the past (before maxX) or future (extrapolated) */
  isFuture: boolean;
  /** The linear regression used for calculation */
  regression: LinearRegression | null;
  /** The SOTA points used for the regression */
  sotaPoints: TrendPoint[];
};

/**
 * Compute SOTA (State-of-the-Art) points from an array of data points.
 * SOTA points are models that were the best at their release time.
 *
 * @param data - Array of points with x (timestamp) and y (score)
 * @returns Array of SOTA points sorted by x (timestamp)
 */
export function computeSotaPoints(
  data: Array<{ x: number; y: number }>
): TrendPoint[] {
  const sorted = [...data].sort((a, b) => a.x - b.x);
  const sotaPoints: TrendPoint[] = [];
  let maxScore = -Infinity;

  for (const point of sorted) {
    if (point.y > maxScore) {
      maxScore = point.y;
      sotaPoints.push({ x: point.x, y: point.y });
    }
  }

  return sotaPoints;
}

/**
 * Compute SOTA points from MappedBots data (the format used in the chart).
 *
 * @param bots - MappedBots array from the chart
 * @returns Array of SOTA points sorted by release date
 */
export function computeSotaPointsFromBots(bots: MappedBots): TrendPoint[] {
  const data = bots.map((bot) => ({
    x: +bot.releaseDate,
    y: bot.score,
  }));
  return computeSotaPoints(data);
}

/**
 * Compute SOTA points directly from leaderboard data.
 *
 * @param leaderboard - Raw leaderboard details
 * @param cutoffDate - Optional cutoff date for filtering bots
 * @returns Array of SOTA points sorted by release date
 */
export function computeSotaPointsFromLeaderboard(
  leaderboard: LeaderboardDetails,
  cutoffDate?: Date
): TrendPoint[] {
  const bots = getBots(leaderboard, cutoffDate);
  return computeSotaPointsFromBots(bots);
}

/**
 * Calculate linear regression coefficients from an array of points.
 *
 * @param points - Array of {x, y} points
 * @returns LinearRegression with slope and intercept, or null if calculation fails
 */
export function calculateLinearRegression(
  points: TrendPoint[]
): LinearRegression | null {
  const n = points.length;
  if (n === 0) return null;

  const xVals = points.map((d) => d.x);
  const yVals = points.map((d) => d.y);

  const sumX = xVals.reduce((a, b) => a + b, 0);
  const sumY = yVals.reduce((a, b) => a + b, 0);
  const sumXY = xVals.reduce((total, x, i) => total + x * (yVals[i] ?? 0), 0);
  const sumX2 = xVals.reduce((total, x) => total + x * x, 0);
  const denominator = n * sumX2 - sumX * sumX;

  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Calculate the x value (timestamp) where the trend line reaches a given y value.
 *
 * @param regression - Linear regression coefficients
 * @param targetY - The target y value to find crossing for
 * @returns The x value (timestamp) where y equals targetY, or null if slope is 0
 */
export function calculateCrossingX(
  regression: LinearRegression,
  targetY: number
): number | null {
  const { slope, intercept } = regression;

  // If slope is 0, the line is horizontal and may never cross
  if (slope === 0) {
    return null;
  }

  // y = slope * x + intercept
  // targetY = slope * x + intercept
  // x = (targetY - intercept) / slope
  return (targetY - intercept) / slope;
}

/**
 * Calculate when the SOTA trend line crosses a given score threshold.
 * Works with pre-computed SOTA points (from the chart).
 *
 * @param sotaPoints - Pre-computed SOTA points (already filtered/sorted)
 * @param targetScore - The score threshold to find crossing for
 * @param maxX - Optional maximum x value to determine if crossing is in the future
 * @returns SotaCrossingResult with crossing details
 */
export function calculateSotaCrossing(
  sotaPoints: TrendPoint[],
  targetScore: number,
  maxX?: number
): SotaCrossingResult {
  if (sotaPoints.length === 0) {
    return {
      crossingTimestamp: null,
      crossingDate: null,
      isFuture: false,
      regression: null,
      sotaPoints: [],
    };
  }

  const regression = calculateLinearRegression(sotaPoints);
  if (!regression) {
    return {
      crossingTimestamp: null,
      crossingDate: null,
      isFuture: false,
      regression: null,
      sotaPoints,
    };
  }

  const crossingX = calculateCrossingX(regression, targetScore);

  // If slope is negative or zero and target is above current max, crossing won't happen
  if (crossingX === null) {
    return {
      crossingTimestamp: null,
      crossingDate: null,
      isFuture: false,
      regression,
      sotaPoints,
    };
  }

  // Determine the actual maxX from data if not provided
  const dataMaxX = maxX ?? Math.max(...sotaPoints.map((p) => p.x));
  const isFuture = crossingX > dataMaxX;

  return {
    crossingTimestamp: crossingX,
    crossingDate: new Date(crossingX),
    isFuture,
    regression,
    sotaPoints,
  };
}

/**
 * Calculate when the SOTA trend line crosses a given score threshold.
 * Works with MappedBots data (the format used in the chart).
 *
 * @param bots - MappedBots array from the chart
 * @param targetScore - The score threshold to find crossing for
 * @returns SotaCrossingResult with crossing details
 */
export function calculateSotaCrossingFromBots(
  bots: MappedBots,
  targetScore: number
): SotaCrossingResult {
  const sotaPoints = computeSotaPointsFromBots(bots);
  const maxX =
    bots.length > 0 ? Math.max(...bots.map((b) => +b.releaseDate)) : undefined;
  return calculateSotaCrossing(sotaPoints, targetScore, maxX);
}

/**
 * Calculate when the SOTA trend line crosses a given score threshold.
 * Works directly with leaderboard data.
 *
 * @param leaderboard - Raw leaderboard details
 * @param targetScore - The score threshold to find crossing for
 * @param cutoffDate - Optional cutoff date for filtering bots
 * @returns SotaCrossingResult with crossing details
 */
export function calculateSotaCrossingFromLeaderboard(
  leaderboard: LeaderboardDetails,
  targetScore: number,
  cutoffDate?: Date
): SotaCrossingResult {
  const bots = getBots(leaderboard, cutoffDate);
  return calculateSotaCrossingFromBots(bots, targetScore);
}

/**
 * Generate trend line data points for rendering (e.g., in Victory charts).
 * Uses pre-computed SOTA points.
 *
 * @param sotaPoints - Pre-computed SOTA points
 * @param minX - Minimum x value for the line
 * @param maxX - Maximum x value for the line
 * @returns Array of two points for rendering the trend line, or empty array if calculation fails
 */
export function generateTrendLineData(
  sotaPoints: TrendPoint[],
  minX: number,
  maxX: number
): TrendPoint[] {
  const regression = calculateLinearRegression(sotaPoints);
  if (!regression) return [];

  const { slope, intercept } = regression;
  return [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept },
  ];
}

/**
 * Generate trend line data points from MappedBots data.
 *
 * @param bots - MappedBots array from the chart
 * @param minX - Optional minimum x value (defaults to earliest bot release date)
 * @param maxX - Optional maximum x value (defaults to latest bot release date)
 * @returns Array of two points for rendering the trend line
 */
export function generateTrendLineDataFromBots(
  bots: MappedBots,
  minX?: number,
  maxX?: number
): TrendPoint[] {
  if (bots.length === 0) return [];

  const timestamps = bots.map((b) => +b.releaseDate);
  const actualMinX = minX ?? Math.min(...timestamps);
  const actualMaxX = maxX ?? Math.max(...timestamps);

  const sotaPoints = computeSotaPointsFromBots(bots);
  return generateTrendLineData(sotaPoints, actualMinX, actualMaxX);
}
