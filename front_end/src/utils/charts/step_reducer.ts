import { Area, AreaPoint, Line, LinePoint } from "@/types/charts";

type StepPoint = {
  x: unknown;
  y: unknown;
  y0?: unknown;
};

export function reduceStepLineSegments<X = number, Y = number | null>(
  points: Line<X, Y>
): Line<X, Y> {
  return reduceStepSegments(points, haveSameLineValue) as Line<X, Y>;
}

export function reduceStepAreaSegments<X = number, Y = number | null>(
  points: Area<X, Y>
): Area<X, Y> {
  return reduceStepSegments(points, haveSameAreaValue) as Area<X, Y>;
}

function reduceStepSegments<P extends StepPoint>(
  points: P[],
  haveSameValue: (a: P, b: P) => boolean
): P[] {
  if (points.length < 3) {
    return points;
  }

  const reduced: P[] = [];
  let segment: P[] = [];

  const flushSegment = () => {
    if (!segment.length) return;
    reduced.push(...reduceSegment(segment, haveSameValue));
    segment = [];
  };

  for (const point of points) {
    if (point.y == null) {
      flushSegment();
      reduced.push(point);
      continue;
    }

    segment.push(point);
  }

  flushSegment();
  return reduced.length < points.length ? reduced : points;
}

function reduceSegment<P extends StepPoint>(
  segment: P[],
  haveSameValue: (a: P, b: P) => boolean
): P[] {
  if (segment.length < 3) {
    return segment;
  }

  const reduced: P[] = [];
  for (let index = 0; index < segment.length; index++) {
    const point = segment[index];
    if (!point) continue;

    const previous = segment[index - 1];
    const next = segment[index + 1];
    if (!previous || !next) {
      reduced.push(point);
      continue;
    }

    if (!haveSameValue(previous, point) || next.y == null) {
      reduced.push(point);
    }
  }

  return reduced;
}

function haveSameLineValue<X, Y>(
  a: LinePoint<X, Y>,
  b: LinePoint<X, Y>
): boolean {
  return Object.is(a.y, b.y);
}

function haveSameAreaValue<X, Y>(
  a: AreaPoint<X, Y>,
  b: AreaPoint<X, Y>
): boolean {
  return Object.is(a.y, b.y) && Object.is(a.y0, b.y0);
}
