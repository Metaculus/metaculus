import { memo } from "react";

import { METAC_COLORS } from "@/constants/colors";

import {
  type Rect,
  type Segment,
  rectsOverlap,
  getSafeBounds,
  isWithinBounds,
  segmentIntersectsRect,
} from "./helpers";

// Label configuration constants
const LABEL_FONT_FAMILY = "system-ui, sans-serif";
const LABEL_FONT_WEIGHT = 500;
const LABEL_STROKE_WIDTH = 2.5;
const LABEL_EDGE_PADDING = 6;
const LABEL_RECT_PADDING = LABEL_STROKE_WIDTH + 1;
const DOT_RADIUS = 4;
// Placement penalties, in pixels of extra leader line: a label covering an
// unlabeled dot, and a leader line crossing a label or marker (or a label
// covering a leader line).
const DOT_COVER_COST = 60;
const CROSSING_COST = 80;
// Reference line captions are drawn this far above their line.
export const REFERENCE_CAPTION_OFFSET = 6;

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

// Farther slots (nearest first), tried only when every POSITIONS slot is
// taken, so labels in a crowded cluster can stack above or below each other.
const FAR_OFFSETS_X = [8, 28, 56, 84, 112];
const FAR_OFFSETS_Y = [
  -56, -48, -40, -32, -24, -16, -8, 8, 16, 24, 32, 40, 48, 56,
];
const FAR_POSITIONS: LabelPosition[] = FAR_OFFSETS_Y.flatMap((dy) => [
  { dx: 0, dy, anchor: "middle" as const },
  ...FAR_OFFSETS_X.flatMap((dx) => [
    { dx, dy, anchor: "start" as const },
    { dx: -dx, dy, anchor: "end" as const },
  ]),
]).sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy));

const CANDIDATE_POSITIONS: LabelPosition[] = [...POSITIONS, ...FAR_POSITIONS];

type LabelAnchor = "start" | "middle" | "end";
type LabelPosition = { dx: number; dy: number; anchor: LabelAnchor };

type Padding = { top: number; bottom: number; left: number; right: number };
type SafeBounds = ReturnType<typeof getSafeBounds>;

type CollisionAwareLabelsProps = {
  data: Array<{
    showLabel: boolean;
    isHighlighted: boolean;
    isSota: boolean;
    isHoveredPoint: boolean;
    x: number;
    y: number;
    name: string;
    label: string;
    family: string | undefined;
    pointKey: string;
  }>;
  referenceLines: Array<{ y: number; label: string }>;
  xDomain: [number, number];
  yDomain: [number, number];
  colorForFamily: (family: string) => string;
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string;
  padding: Padding;
  chartWidth: number;
  chartHeight: number;
  domainPadding: { x: number; y: number };
  labelFontSize: number;
};

type Placement = {
  labelX: number;
  labelY: number;
  anchor: LabelAnchor;
  rect: Rect;
  leader: Segment;
};

export type PlacedLabel = Placement & {
  name: string;
  color: string;
};

type Obstacles = {
  // Placed labels and reference captions
  labels: Rect[];
  // Leader lines of placed labels
  leaders: Segment[];
  // Markers of labeled points
  markers: Rect[];
  // Other visible dots
  dots: Rect[];
};

function textRectX(labelX: number, anchor: LabelAnchor, textWidth: number) {
  if (anchor === "end") return labelX - textWidth;
  if (anchor === "middle") return labelX - textWidth / 2;
  return labelX;
}

// Places the label at the offset, shifted back inside the safe bounds.
function placeAt(
  point: { x: number; y: number },
  position: LabelPosition,
  textWidth: number,
  textHeight: number,
  safeBounds: SafeBounds
): Placement {
  const paddedWidth = textWidth + 2 * LABEL_RECT_PADDING;
  const paddedHeight = textHeight + 2 * LABEL_RECT_PADDING;
  const unclampedX =
    textRectX(point.x + position.dx, position.anchor, textWidth) -
    LABEL_RECT_PADDING;
  const unclampedY =
    point.y + position.dy - textHeight / 2 - LABEL_RECT_PADDING;
  const rectX = Math.min(
    Math.max(unclampedX, safeBounds.left),
    safeBounds.right - paddedWidth
  );
  const rectY = Math.min(
    Math.max(unclampedY, safeBounds.top),
    safeBounds.bottom - paddedHeight
  );
  const textX = rectX + LABEL_RECT_PADDING;
  const labelX =
    position.anchor === "end"
      ? textX + textWidth
      : position.anchor === "middle"
        ? textX + textWidth / 2
        : textX;
  const labelY = rectY + LABEL_RECT_PADDING + textHeight / 2;
  // The leader line stops just short of the text
  const leaderEndX =
    position.anchor === "end"
      ? labelX + 2
      : position.anchor === "start"
        ? labelX - 2
        : labelX;
  return {
    labelX,
    labelY,
    anchor: position.anchor,
    rect: { x: rectX, y: rectY, width: paddedWidth, height: paddedHeight },
    leader: {
      start: { x: point.x, y: point.y },
      end: { x: leaderEndX, y: labelY },
    },
  };
}

// A label never covers another label, a reference caption or a labeled
// marker; slots that would are conflicts. Among the other slots, the first
// fully clear one in POSITIONS wins outright, and otherwise the cheapest wins:
// leader length in pixels plus the penalties for covered dots and crossings.
// Without allowLabelOverlap a label with only conflicting slots is not placed;
// with it, the slot with the fewest conflicts is the last resort.
function findPlacement(
  point: { x: number; y: number },
  ownMarker: Rect,
  textWidth: number,
  textHeight: number,
  safeBounds: SafeBounds,
  obstacles: Obstacles,
  allowLabelOverlap: boolean
): Placement | null {
  let best: { placement: Placement; cost: number } | null = null;
  let leastConflict: { placement: Placement; conflicts: number } | null = null;
  const countHits = (list: Rect[], hit: (obstacle: Rect) => boolean) =>
    list.filter(hit).length;
  // A label sits right next to its own point, so only its text (not the
  // padded box) must stay off the drawn symbol; stars are one size larger.
  const ownSymbolRadius = DOT_RADIUS + 1;
  const ownSymbol: Rect = {
    x: point.x - ownSymbolRadius,
    y: point.y - ownSymbolRadius,
    width: 2 * ownSymbolRadius,
    height: 2 * ownSymbolRadius,
  };

  for (const [index, position] of CANDIDATE_POSITIONS.entries()) {
    const placement = placeAt(
      point,
      position,
      textWidth,
      textHeight,
      safeBounds
    );
    const { rect, leader } = placement;
    if (!isWithinBounds(rect, safeBounds)) continue;
    const textBox: Rect = {
      x: rect.x + LABEL_RECT_PADDING,
      y: rect.y + LABEL_RECT_PADDING,
      width: textWidth,
      height: textHeight,
    };

    const conflicts =
      countHits(obstacles.labels, (r) => rectsOverlap(rect, r)) +
      countHits(
        obstacles.markers,
        (r) => r !== ownMarker && rectsOverlap(rect, r)
      ) +
      (rectsOverlap(textBox, ownSymbol, 0) ? 1 : 0);
    const crossings =
      countHits(obstacles.labels, (r) => segmentIntersectsRect(leader, r)) +
      countHits(
        obstacles.markers,
        (r) => r !== ownMarker && segmentIntersectsRect(leader, r)
      ) +
      obstacles.leaders.filter((segment) =>
        segmentIntersectsRect(segment, rect)
      ).length;
    const dotHits = countHits(obstacles.dots, (r) => rectsOverlap(rect, r));

    if (conflicts > 0) {
      if (
        allowLabelOverlap &&
        (!leastConflict || conflicts < leastConflict.conflicts)
      ) {
        leastConflict = { placement, conflicts };
      }
      continue;
    }
    if (crossings === 0 && dotHits === 0 && index < POSITIONS.length) {
      return placement;
    }
    const leaderLength = Math.hypot(
      leader.end.x - leader.start.x,
      leader.end.y - leader.start.y
    );
    const cost =
      leaderLength + DOT_COVER_COST * dotHits + CROSSING_COST * crossings;
    if (!best || cost < best.cost) best = { placement, cost };
  }

  return best?.placement ?? leastConflict?.placement ?? null;
}

export function computeLabelLayout(
  props: Omit<CollisionAwareLabelsProps, "getThemeColor">
): PlacedLabel[] {
  const {
    data,
    referenceLines,
    xDomain,
    yDomain,
    colorForFamily,
    padding,
    chartWidth,
    chartHeight,
    domainPadding,
    labelFontSize,
  } = props;
  if (!data || data.length === 0) return [];

  // Calculate scale functions from domain to pixel
  // Victory passes scale when this is a child of VictoryChart
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const domainPadX = domainPadding.x;
  const domainPadY = domainPadding.y;

  // Calculate manually
  const scaleX = (val: number) => {
    const xSpan = xDomain[1] - xDomain[0];
    if (xSpan === 0) {
      // Degenerate domain: return center pixel
      return padding.left + plotWidth / 2;
    }
    const ratio = (val - xDomain[0]) / xSpan;
    return padding.left + domainPadX + ratio * (plotWidth - 2 * domainPadX);
  };
  const scaleY = (val: number) => {
    const ySpan = yDomain[1] - yDomain[0];
    if (ySpan === 0) {
      // Degenerate domain: return center pixel
      return chartHeight - padding.bottom - plotHeight / 2;
    }
    const ratio = (val - yDomain[0]) / ySpan;
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
  const points = data.map((datum) => {
    const x = scaleX(datum.x);
    const y = scaleY(datum.y);
    const marker: Rect = {
      x: x - DOT_RADIUS - 2,
      y: y - DOT_RADIUS - 2,
      width: (DOT_RADIUS + 2) * 2,
      height: (DOT_RADIUS + 2) * 2,
    };
    return { x, y, marker, datum };
  });

  const isAlwaysLabeled = (datum: (typeof data)[number]) =>
    datum.showLabel && datum.isHighlighted;
  // Highest on screen (best score) is placed first and gets the nearest slot.
  const labeledPoints = points
    .filter((p) => isAlwaysLabeled(p.datum))
    .sort((a, b) => a.y - b.y);
  const plotRight = scaleX(xDomain[1]);

  const obstacles: Obstacles = {
    // Reference line captions sit above the right end of each dashed line.
    labels: referenceLines.map((line) => {
      const captionWidth = estimateTextWidth(line.label, labelFontSize);
      return {
        x: plotRight + 2 - captionWidth,
        y: scaleY(line.y) - REFERENCE_CAPTION_OFFSET - labelFontSize,
        width: captionWidth,
        height: labelFontSize + 2,
      };
    }),
    leaders: [],
    markers: labeledPoints.map((p) => p.marker),
    dots: points
      .filter((p) => p.datum.isHighlighted && !isAlwaysLabeled(p.datum))
      .map((p) => p.marker),
  };

  const placedLabels: PlacedLabel[] = [];
  const placedPoints = new Set<(typeof points)[number]>();
  const place = (p: (typeof points)[number], allowLabelOverlap: boolean) => {
    const placement = findPlacement(
      p,
      p.marker,
      estimateTextWidth(p.datum.name, labelFontSize),
      labelFontSize + 2,
      safeBounds,
      obstacles,
      allowLabelOverlap
    );
    if (!placement) return;
    placedPoints.add(p);
    obstacles.labels.push(placement.rect);
    obstacles.leaders.push(placement.leader);
    placedLabels.push({
      ...placement,
      name: p.datum.name,
      color: colorForFamily(p.datum.family ?? ""),
    });
  };

  for (const p of labeledPoints) place(p, false);
  // A hovered point's label (including one hidden for lack of space) is
  // placed last, so showing it never moves or hides the labels on screen.
  const hoveredPoints = points.filter(
    (p) => p.datum.isHoveredPoint && !placedPoints.has(p)
  );
  for (const p of hoveredPoints) {
    obstacles.markers.push(p.marker);
    place(p, true);
  }

  return placedLabels;
}

// Collision-aware labels component - renders as a Victory child to get access to scale
// Memoized to prevent expensive collision detection on every parent render
export const CollisionAwareLabels = memo(function CollisionAwareLabels(
  props: CollisionAwareLabelsProps
) {
  const { getThemeColor, labelFontSize } = props;
  const labelsToRender = computeLabelLayout(props);
  if (labelsToRender.length === 0) return null;

  return (
    <g>
      {/* Render labels with leader lines */}
      {labelsToRender.map((label, i) => {
        return (
          <g key={`label-${i}`}>
            {/* Leader line */}
            <line
              x1={label.leader.start.x}
              y1={label.leader.start.y}
              x2={label.leader.end.x}
              y2={label.leader.end.y}
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
