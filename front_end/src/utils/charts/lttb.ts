import { Line, LinePoint } from "@/types/charts";

type NumericPoint = { index: number; x: number; y: number };

export const FEED_CHART_TARGET_POINTS = 50;

// Largest-Triangle-Three-Buckets downsampling.
// Reference: Sveinn Steinarsson, "Downsampling Time Series for Visual Representation" (2013).
// Preserves the first and last points; for each interior bucket, picks the point
// that forms the largest triangle with the previously selected point and the
// average point of the next bucket. Points with non-numeric y are skipped.
export function lttb<X = number, Y = number | null>(
  points: Line<X, Y>,
  targetCount: number
): Line<X, Y> {
  if (targetCount < 3 || targetCount >= points.length) {
    return points;
  }

  const numericPoints: NumericPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i] as LinePoint<X, Y>;
    const x = Number(point.x);
    const y = Number(point.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      numericPoints.push({ index: i, x, y });
    }
  }

  const n = numericPoints.length;
  const first = numericPoints[0];
  const last = numericPoints[n - 1];
  if (n <= targetCount || !first || !last) {
    return points;
  }

  const bucketSize = (n - 2) / (targetCount - 2);
  const sampledIndices: number[] = [first.index];

  let previous = first;
  for (let bucket = 0; bucket < targetCount - 2; bucket++) {
    const currentStart = Math.floor(bucket * bucketSize) + 1;
    const currentEnd = Math.min(
      Math.floor((bucket + 1) * bucketSize) + 1,
      n - 1
    );

    let avgX = 0;
    let avgY = 0;
    if (bucket === targetCount - 3) {
      avgX = last.x;
      avgY = last.y;
    } else {
      const nextEnd = Math.min(
        Math.floor((bucket + 2) * bucketSize) + 1,
        n - 1
      );
      let count = 0;
      for (let j = currentEnd; j < nextEnd; j++) {
        const np = numericPoints[j];
        if (!np) continue;
        avgX += np.x;
        avgY += np.y;
        count += 1;
      }
      if (count > 0) {
        avgX /= count;
        avgY /= count;
      }
    }

    let maxArea = -1;
    let chosen: NumericPoint = previous;
    for (let j = currentStart; j < currentEnd; j++) {
      const candidate = numericPoints[j];
      if (!candidate) continue;
      const area =
        Math.abs(
          (previous.x - avgX) * (candidate.y - previous.y) -
            (previous.x - candidate.x) * (avgY - previous.y)
        ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        chosen = candidate;
      }
    }
    sampledIndices.push(chosen.index);
    previous = chosen;
  }

  sampledIndices.push(last.index);

  return sampledIndices.map((index) => points[index] as LinePoint<X, Y>);
}
