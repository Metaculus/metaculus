import { memo, useMemo } from "react";

import { METAC_COLORS } from "@/constants/colors";

import { getSafeBounds, type Rect } from "./helpers";
import {
  computeLabelLayout,
  createLabelLayoutMemory,
  type LabelLayoutMemory,
  type LabelLayoutPoint,
  type LineObstacle,
} from "./label-layout";

const LABEL_FONT_FAMILY = "system-ui, sans-serif";
const LABEL_FONT_WEIGHT = 500;
const LABEL_STROKE_WIDTH = 2.5;
const LABEL_EDGE_PADDING = 6;
const LABEL_RECT_PADDING = LABEL_STROKE_WIDTH + 1;
const DOT_OBSTACLE_RADIUS = 6;
// Must match how the chart positions its reference-line captions.
const REFERENCE_LABEL_FONT_WEIGHT = 600;
const REFERENCE_LABEL_DX = 2;
const REFERENCE_LABEL_DY = -6;

const labelMeasureCanvas =
  typeof document !== "undefined" ? document.createElement("canvas") : null;

function measureText(
  text: string,
  fontSize: number,
  fontWeight: number
): number {
  const avgCharWidth = fontSize * 0.6;
  if (!labelMeasureCanvas) return Math.ceil(text.length * avgCharWidth);
  const ctx = labelMeasureCanvas.getContext("2d");
  if (!ctx) return Math.ceil(text.length * avgCharWidth);
  ctx.font = `${fontWeight} ${fontSize}px ${LABEL_FONT_FAMILY}`;
  return Math.ceil(ctx.measureText(text).width);
}

function measureLabelText(text: string, fontSize: number): number {
  return measureText(text, fontSize, LABEL_FONT_WEIGHT);
}

type Padding = { top: number; bottom: number; left: number; right: number };

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
  xDomain: [number, number];
  yDomain: [number, number];
  // Data-space endpoints of the trend line, or empty when there is none.
  trendLine: Array<{ x: number; y: number }>;
  // Horizontal reference lines, each captioned at its right end.
  referenceLines: Array<{ y: number; label: string }>;
  colorForFamily: (family: string) => string;
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string;
  padding: Padding;
  chartWidth: number;
  chartHeight: number;
  domainPadding: { x: number; y: number };
  labelFontSize: number;
};

// Renders model-name labels as a VictoryChart child. Pixel positions are
// recomputed here from the domain because Victory does not pass its scale to
// arbitrary children. Memoized so the layout only reruns when inputs change,
// and label positions are remembered across renders so hovering a point adds
// one label without moving the others.
export const CollisionAwareLabels = memo(function CollisionAwareLabels(
  props: CollisionAwareLabelsProps
) {
  const {
    data,
    xDomain,
    yDomain,
    trendLine,
    referenceLines,
    colorForFamily,
    getThemeColor,
    padding,
    chartWidth,
    chartHeight,
    domainPadding,
    labelFontSize,
  } = props;
  // Remembered label positions only stay valid while the pixel geometry does.
  const layoutMemory: LabelLayoutMemory = useMemo(
    () => createLabelLayoutMemory(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chartWidth, chartHeight, labelFontSize, xDomain.join(), yDomain.join()]
  );
  if (!data || data.length === 0) return null;

  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const scaleX = (val: number) => {
    const xSpan = xDomain[1] - xDomain[0];
    if (xSpan === 0) return padding.left + plotWidth / 2;
    const ratio = (val - xDomain[0]) / xSpan;
    return (
      padding.left + domainPadding.x + ratio * (plotWidth - 2 * domainPadding.x)
    );
  };
  const scaleY = (val: number) => {
    const ySpan = yDomain[1] - yDomain[0];
    if (ySpan === 0) return chartHeight - padding.bottom - plotHeight / 2;
    const ratio = (val - yDomain[0]) / ySpan;
    return (
      chartHeight -
      padding.bottom -
      domainPadding.y -
      ratio * (plotHeight - 2 * domainPadding.y)
    );
  };

  const safeBounds = getSafeBounds(
    padding,
    chartWidth,
    chartHeight,
    LABEL_EDGE_PADDING + LABEL_STROKE_WIDTH
  );

  const colorByName = new Map<string, string>();
  const layoutPoints: LabelLayoutPoint[] = data.map((datum) => {
    const isVisible = datum.isHighlighted || datum.isHoveredPoint;
    colorByName.set(datum.name, colorForFamily(datum.family ?? ""));
    return {
      x: scaleX(datum.x),
      y: scaleY(datum.y),
      name: datum.name,
      isObstacle: isVisible,
      wantsLabel: datum.showLabel && isVisible,
    };
  });

  const plotLeft = scaleX(xDomain[0]);
  const plotRight = scaleX(xDomain[1]);
  const lineObstacles: LineObstacle[] = referenceLines.map((line) => [
    { x: plotLeft, y: scaleY(line.y) },
    { x: plotRight, y: scaleY(line.y) },
  ]);
  const [trendStart, trendEnd] = trendLine;
  if (trendStart && trendEnd) {
    lineObstacles.push([
      { x: scaleX(trendStart.x), y: scaleY(trendStart.y) },
      { x: scaleX(trendEnd.x), y: scaleY(trendEnd.y) },
    ]);
  }
  const referenceCaptionRects: Rect[] = referenceLines.map((line) => {
    const width = measureText(
      line.label,
      labelFontSize,
      REFERENCE_LABEL_FONT_WEIGHT
    );
    const right = plotRight + REFERENCE_LABEL_DX;
    const centerY = scaleY(line.y) + REFERENCE_LABEL_DY;
    return {
      x: right - width,
      y: centerY - labelFontSize / 2,
      width,
      height: labelFontSize,
    };
  });

  const placedLabels = computeLabelLayout(
    layoutPoints,
    {
      safeBounds,
      fontSize: labelFontSize,
      measureText: measureLabelText,
      rectPadding: LABEL_RECT_PADDING,
      dotRadius: DOT_OBSTACLE_RADIUS,
      extraObstacles: referenceCaptionRects,
      lineObstacles,
    },
    layoutMemory
  );

  const outlineColor = getThemeColor(METAC_COLORS.gray[0]);

  return (
    <g>
      {placedLabels.map((label) => {
        const color = colorByName.get(label.name) ?? outlineColor;
        return (
          <g key={`label-${label.name}-${label.x}-${label.y}`}>
            <line
              x1={label.x}
              y1={label.y}
              x2={label.leaderEnd.x}
              y2={label.leaderEnd.y}
              stroke={color}
              strokeWidth={0.75}
              strokeOpacity={0.7}
            />
            <text
              x={label.labelX}
              y={label.labelY}
              textAnchor={label.anchor}
              dominantBaseline="middle"
              fill={outlineColor}
              stroke={outlineColor}
              strokeWidth={LABEL_STROKE_WIDTH}
              fontSize={labelFontSize}
              fontFamily={LABEL_FONT_FAMILY}
              fontWeight={LABEL_FONT_WEIGHT}
            >
              {label.name}
            </text>
            <text
              x={label.labelX}
              y={label.labelY}
              textAnchor={label.anchor}
              dominantBaseline="middle"
              fill={color}
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
