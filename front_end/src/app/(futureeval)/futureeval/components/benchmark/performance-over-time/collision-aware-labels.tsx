import { memo } from "react";

import { METAC_COLORS } from "@/constants/colors";

import {
  type Rect,
  rectsOverlap,
  overlapArea,
  getSafeBounds,
  isWithinBounds,
} from "./helpers";

// Label configuration constants
const LABEL_FONT_FAMILY = "system-ui, sans-serif";
const LABEL_FONT_WEIGHT = 500;
const LABEL_STROKE_WIDTH = 2.5;
const LABEL_EDGE_PADDING = 6;
const LABEL_RECT_PADDING = LABEL_STROKE_WIDTH + 1;

const labelMeasureCanvas =
  typeof document !== "undefined" ? document.createElement("canvas") : null;

// Estimate text width using the actual label font.
function estimateTextWidth(text: string, fontSize: number): number {
  const avgCharWidth = fontSize * 0.6;
  if (!labelMeasureCanvas) return Math.ceil(text.length * avgCharWidth);
  const ctx = labelMeasureCanvas.getContext("2d");
  if (!ctx) return Math.ceil(text.length * avgCharWidth);
  ctx.font = `${LABEL_FONT_WEIGHT} ${fontSize}px ${LABEL_FONT_FAMILY}`;
  return Math.ceil(ctx.measureText(text).width);
}

// Label position options
const POSITIONS = [
  { dx: 6, dy: -4, anchor: "start" as const }, // right-up
  { dx: 6, dy: 4, anchor: "start" as const }, // right-down
  { dx: -6, dy: -4, anchor: "end" as const }, // left-up
  { dx: -6, dy: 4, anchor: "end" as const }, // left-down
  { dx: 0, dy: -10, anchor: "middle" as const }, // top
  { dx: 0, dy: 14, anchor: "middle" as const }, // bottom
  { dx: 12, dy: -8, anchor: "start" as const }, // far right-up
  { dx: -12, dy: -8, anchor: "end" as const }, // far left-up
  { dx: 12, dy: 8, anchor: "start" as const }, // far right-down
  { dx: -12, dy: 8, anchor: "end" as const }, // far left-down
  { dx: 20, dy: -12, anchor: "start" as const }, // farther right-up
  { dx: -20, dy: -12, anchor: "end" as const }, // farther left-up
  { dx: 20, dy: 12, anchor: "start" as const }, // farther right-down
  { dx: -20, dy: 12, anchor: "end" as const }, // farther left-down
  { dx: 0, dy: -18, anchor: "middle" as const }, // farther top
  { dx: 0, dy: 22, anchor: "middle" as const }, // farther bottom
  { dx: 36, dy: -20, anchor: "start" as const }, // extreme right-up
  { dx: -36, dy: -20, anchor: "end" as const }, // extreme left-up
  { dx: 36, dy: 20, anchor: "start" as const }, // extreme right-down
  { dx: -36, dy: 20, anchor: "end" as const }, // extreme left-down
  { dx: 0, dy: -26, anchor: "middle" as const }, // extreme top
  { dx: 0, dy: 30, anchor: "middle" as const }, // extreme bottom
  { dx: 44, dy: -24, anchor: "start" as const }, // max right-up
  { dx: -44, dy: -24, anchor: "end" as const }, // max left-up
  { dx: 44, dy: 24, anchor: "start" as const }, // max right-down
  { dx: -44, dy: 24, anchor: "end" as const }, // max left-down
];

type Padding = { top: number; bottom: number; left: number; right: number };

type CollisionAwareLabelsProps = {
  data: Array<{
    x: number;
    y: number;
    name: string;
    provider: string;
    isHighlighted: boolean;
    showLabel: boolean;
    isHoveredPoint: boolean;
  }>;
  xDomain: [number, number];
  yDomain: [number, number];
  colorForName: (name: string) => string;
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string;
  padding: Padding;
  chartWidth: number;
  chartHeight: number;
  domainPadding: { x: number; y: number };
  labelFontSize: number;
};

// Collision-aware labels component - renders as a Victory child to get access to scale
// Memoized to prevent expensive collision detection on every parent render
export const CollisionAwareLabels = memo(function CollisionAwareLabels(
  props: CollisionAwareLabelsProps
) {
  const {
    data,
    xDomain,
    yDomain,
    colorForName,
    getThemeColor,
    padding,
    chartWidth,
    chartHeight,
    domainPadding,
    labelFontSize,
  } = props;
  if (!data || data.length === 0) return null;
  const defaultPosition = POSITIONS[0];
  if (!defaultPosition) return null;

  // Calculate scale functions from domain to pixel
  // Victory passes scale when this is a child of VictoryChart
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const domainPadX = domainPadding.x;
  const domainPadY = domainPadding.y;

  // Calculate manually
  const scaleX = (val: number) => {
    const ratio = (val - xDomain[0]) / (xDomain[1] - xDomain[0]);
    return padding.left + domainPadX + ratio * (plotWidth - 2 * domainPadX);
  };
  const scaleY = (val: number) => {
    const ratio = (val - yDomain[0]) / (yDomain[1] - yDomain[0]);
    return (
      chartHeight -
      padding.bottom -
      domainPadY -
      ratio * (plotHeight - 2 * domainPadY)
    );
  };

  // Safe bounds for label placement
  const safeBounds = getSafeBounds(
    padding,
    chartWidth,
    chartHeight,
    LABEL_EDGE_PADDING + LABEL_STROKE_WIDTH
  );

  // Convert data to pixel coordinates
  const points = data.map((datum) => ({
    x: scaleX(datum.x),
    y: scaleY(datum.y),
    datum,
  }));

  // Now compute label positions with collision detection
  const placedRects: Rect[] = [];
  const DOT_RADIUS = 4;

  // Add all highlighted dots as obstacles first
  for (const p of points) {
    if (p.datum.isHighlighted || p.datum.isHoveredPoint) {
      placedRects.push({
        x: p.x - DOT_RADIUS - 2,
        y: p.y - DOT_RADIUS - 2,
        width: (DOT_RADIUS + 2) * 2,
        height: (DOT_RADIUS + 2) * 2,
      });
    }
  }

  // Compute labels for highlighted points that should show labels
  const labelsToRender: Array<{
    x: number;
    y: number;
    labelX: number;
    labelY: number;
    anchor: string;
    name: string;
    color: string;
  }> = [];

  // Sort by y pixel (lower y = higher on screen = higher score = priority)
  const sortedPoints = [...points]
    .filter(
      (p) =>
        p.datum.showLabel && (p.datum.isHighlighted || p.datum.isHoveredPoint)
    )
    .sort((a, b) => a.y - b.y);

  const clampLabelPosition = (
    labelX: number,
    labelY: number,
    anchor: string,
    textWidth: number,
    textHeight: number
  ) => {
    let rectX =
      anchor === "end"
        ? labelX - textWidth
        : anchor === "middle"
          ? labelX - textWidth / 2
          : labelX;
    let rectY = labelY - textHeight / 2;

    let paddedRectX = rectX - LABEL_RECT_PADDING;
    let paddedRectY = rectY - LABEL_RECT_PADDING;
    const paddedWidth = textWidth + 2 * LABEL_RECT_PADDING;
    const paddedHeight = textHeight + 2 * LABEL_RECT_PADDING;

    if (paddedRectX < safeBounds.left) {
      paddedRectX = safeBounds.left;
    }
    if (paddedRectX + paddedWidth > safeBounds.right) {
      paddedRectX = safeBounds.right - paddedWidth;
    }
    if (paddedRectY < safeBounds.top) {
      paddedRectY = safeBounds.top;
    }
    if (paddedRectY + paddedHeight > safeBounds.bottom) {
      paddedRectY = safeBounds.bottom - paddedHeight;
    }

    rectX = paddedRectX + LABEL_RECT_PADDING;
    rectY = paddedRectY + LABEL_RECT_PADDING;

    return {
      labelX:
        anchor === "end"
          ? rectX + textWidth
          : anchor === "middle"
            ? rectX + textWidth / 2
            : rectX,
      labelY: rectY + textHeight / 2,
    };
  };

  for (const p of sortedPoints) {
    const textWidth = estimateTextWidth(p.datum.name, labelFontSize);
    const textHeight = labelFontSize + 2;
    const color = colorForName(p.datum.name);

    let bestPos = defaultPosition;
    let finalLabelX = 0;
    let finalLabelY = 0;
    let bestRect: Rect | null = null;
    let bestOverlapScore = Number.POSITIVE_INFINITY;

    for (const pos of POSITIONS) {
      let labelX = p.x + pos.dx;
      let labelY = p.y + pos.dy;
      const clamped = clampLabelPosition(
        labelX,
        labelY,
        pos.anchor,
        textWidth,
        textHeight
      );
      labelX = clamped.labelX;
      labelY = clamped.labelY;

      let rectX: number;
      if (pos.anchor === "end") {
        rectX = labelX - textWidth;
      } else if (pos.anchor === "middle") {
        rectX = labelX - textWidth / 2;
      } else {
        rectX = labelX;
      }
      const rectY = labelY - textHeight / 2;

      const candidate: Rect = {
        x: rectX - LABEL_RECT_PADDING,
        y: rectY - LABEL_RECT_PADDING,
        width: textWidth + 2 * LABEL_RECT_PADDING,
        height: textHeight + 2 * LABEL_RECT_PADDING,
      };

      // Check both collision with other labels/dots AND boundary constraints
      const overlappingRects = placedRects.filter((r) =>
        rectsOverlap(candidate, r)
      );
      const overlapCount = overlappingRects.length;
      const overlapPenalty =
        overlapCount === 0
          ? 0
          : overlappingRects.reduce(
              (sum, r) => sum + overlapArea(candidate, r),
              0
            );
      const withinBounds = isWithinBounds(candidate, safeBounds);

      if (!withinBounds) continue;
      if (overlapCount === 0) {
        bestPos = pos;
        bestRect = candidate;
        finalLabelX = labelX;
        finalLabelY = labelY;
        bestOverlapScore = 0;
        break;
      }

      const score = overlapCount * 1_000_000 + overlapPenalty;
      if (score < bestOverlapScore) {
        bestOverlapScore = score;
        bestPos = pos;
        bestRect = candidate;
        finalLabelX = labelX;
        finalLabelY = labelY;
      }
    }

    if (!bestRect) {
      continue;
    }

    const finalPos = bestPos;
    placedRects.push(bestRect);
    labelsToRender.push({
      x: p.x,
      y: p.y,
      labelX: finalLabelX,
      labelY: finalLabelY,
      anchor: finalPos.anchor,
      name: p.datum.name,
      color,
    });
  }

  return (
    <g>
      {/* Render labels with leader lines */}
      {labelsToRender.map((label, i) => {
        // Calculate where leader line connects to label (close to label text)
        const lineEndX =
          label.anchor === "end"
            ? label.labelX + 2
            : label.anchor === "start"
              ? label.labelX - 2
              : label.labelX;

        return (
          <g key={`label-${i}`}>
            {/* Leader line */}
            <line
              x1={label.x}
              y1={label.y}
              x2={lineEndX}
              y2={label.labelY}
              stroke={label.color}
              strokeWidth={0.75}
              strokeOpacity={0.7}
            />
            {/* Theme-aware outline */}
            <text
              x={label.labelX}
              y={label.labelY}
              textAnchor={label.anchor}
              dominantBaseline="middle"
              fill={getThemeColor(METAC_COLORS.gray[0])}
              stroke={getThemeColor(METAC_COLORS.gray[0])}
              strokeWidth={LABEL_STROKE_WIDTH}
              fontSize={labelFontSize}
              fontFamily={LABEL_FONT_FAMILY}
              fontWeight={LABEL_FONT_WEIGHT}
            >
              {label.name}
            </text>
            {/* Colored label */}
            <text
              x={label.labelX}
              y={label.labelY}
              textAnchor={label.anchor}
              dominantBaseline="middle"
              fill={label.color}
              fontSize={labelFontSize}
              fontFamily={LABEL_FONT_FAMILY}
              fontWeight={LABEL_FONT_WEIGHT}
            >
              {label.name}
            </text>
          </g>
        );
      })}
    </g>
  );
});
