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

export type Segment = {
  start: { x: number; y: number };
  end: { x: number; y: number };
};

// Liang-Barsky clipping: true if any part of the segment lies inside the rect.
export function segmentIntersectsRect(segment: Segment, rect: Rect): boolean {
  const deltaX = segment.end.x - segment.start.x;
  const deltaY = segment.end.y - segment.start.y;
  const edges: Array<[number, number]> = [
    [-deltaX, segment.start.x - rect.x],
    [deltaX, rect.x + rect.width - segment.start.x],
    [-deltaY, segment.start.y - rect.y],
    [deltaY, rect.y + rect.height - segment.start.y],
  ];
  let enter = 0;
  let exit = 1;
  for (const [direction, distance] of edges) {
    if (direction === 0) {
      if (distance < 0) return false;
      continue;
    }
    const ratio = distance / direction;
    if (direction < 0) enter = Math.max(enter, ratio);
    else exit = Math.min(exit, ratio);
    if (enter > exit) return false;
  }
  return true;
}

type Padding = { top: number; bottom: number; left: number; right: number };

// Safe bounds for labels (with padding from chart edges)
export function getSafeBounds(
  padding: Padding,
  chartWidth: number,
  chartHeight: number,
  edgePadding = 10
) {
  return {
    left: padding.left + edgePadding,
    right: chartWidth - padding.right - edgePadding,
    top: padding.top + edgePadding,
    bottom: chartHeight - padding.bottom - edgePadding,
  };
}

// Check if a rectangle is within the safe chart bounds
export function isWithinBounds(
  rect: Rect,
  safeBounds: ReturnType<typeof getSafeBounds>
): boolean {
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
