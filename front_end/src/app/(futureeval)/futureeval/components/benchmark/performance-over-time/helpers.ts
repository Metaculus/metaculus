import type { CallbackArgs } from "victory-core";

// Normalize model name to company/group name
export const normalizeToCompany = (name: string) => {
  const first = String(name).split(" ")[0] ?? name;
  return /^gpt/i.test(first) ? "OpenAI" : first;
};

// Rectangle type for collision detection
export type Rect = { x: number; y: number; width: number; height: number };

// Check if two rectangles overlap
export function rectsOverlap(a: Rect, b: Rect, padding = 3): boolean {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  );
}

export function overlapArea(a: Rect, b: Rect): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const w = x2 - x1;
  const h = y2 - y1;
  if (w <= 0 || h <= 0) return 0;
  return w * h;
}

export type Point = { x: number; y: number };

// Liang-Barsky clipping: returns the [tEnter, tExit] parameter range of the
// segment a->b that lies inside rect, or null when the segment misses it.
function clipSegmentToRect(
  a: Point,
  b: Point,
  rect: Rect
): [number, number] | null {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let tEnter = 0;
  let tExit = 1;
  const edges: Array<[number, number]> = [
    [-dx, a.x - rect.x],
    [dx, rect.x + rect.width - a.x],
    [-dy, a.y - rect.y],
    [dy, rect.y + rect.height - a.y],
  ];
  for (const [direction, distance] of edges) {
    if (direction === 0) {
      if (distance < 0) return null;
      continue;
    }
    const t = distance / direction;
    if (direction < 0) {
      if (t > tExit) return null;
      if (t > tEnter) tEnter = t;
    } else {
      if (t < tEnter) return null;
      if (t < tExit) tExit = t;
    }
  }
  return [tEnter, tExit];
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

export function segmentsIntersect(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point
): boolean {
  const o1 = orientation(a1, a2, b1);
  const o2 = orientation(a1, a2, b2);
  const o3 = orientation(b1, b2, a1);
  const o4 = orientation(b1, b2, a2);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

export function segmentIntersectsRect(a: Point, b: Point, rect: Rect): boolean {
  return clipSegmentToRect(a, b, rect) !== null;
}

// Point where the segment from->to first enters rect. Falls back to `to`
// when the segment never touches the rect.
export function segmentEntryIntoRect(
  from: Point,
  to: Point,
  rect: Rect
): Point {
  const clipped = clipSegmentToRect(from, to, rect);
  if (!clipped) return to;
  const [tEnter] = clipped;
  return {
    x: from.x + tEnter * (to.x - from.x),
    y: from.y + tEnter * (to.y - from.y),
  };
}

type Padding = { top: number; bottom: number; left: number; right: number };

export type SafeBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

// Safe bounds for labels (with padding from chart edges)
export function getSafeBounds(
  padding: Padding,
  chartWidth: number,
  chartHeight: number,
  edgePadding = 10
): SafeBounds {
  return {
    left: padding.left + edgePadding,
    right: chartWidth - padding.right - edgePadding,
    top: padding.top + edgePadding,
    bottom: chartHeight - padding.bottom - edgePadding,
  };
}

// Check if a rectangle is within the safe chart bounds
export function isWithinBounds(rect: Rect, safeBounds: SafeBounds): boolean {
  return (
    rect.x >= safeBounds.left &&
    rect.x + rect.width <= safeBounds.right &&
    rect.y >= safeBounds.top &&
    rect.y + rect.height <= safeBounds.bottom
  );
}

export const isValidDate = (d: Date) => !Number.isNaN(+d);
export const toDate = (v: Date | string) =>
  v instanceof Date ? v : new Date(v);
export const safeIndex = (i: CallbackArgs["index"]) =>
  typeof i === "number" ? i : 0;
