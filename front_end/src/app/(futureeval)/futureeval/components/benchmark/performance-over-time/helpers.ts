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
