import { memo } from "react";

import { METAC_COLORS } from "@/constants/colors";

import { getSafeBounds } from "./helpers";
import { computeLabelLayout, type LabelLayoutPoint } from "./label-layout";

const LABEL_FONT_FAMILY = "system-ui, sans-serif";
const LABEL_FONT_WEIGHT = 500;
const LABEL_STROKE_WIDTH = 2.5;
const LABEL_EDGE_PADDING = 6;
const LABEL_RECT_PADDING = LABEL_STROKE_WIDTH + 1;
const DOT_OBSTACLE_RADIUS = 6;

const labelMeasureCanvas =
  typeof document !== "undefined" ? document.createElement("canvas") : null;

function measureLabelText(text: string, fontSize: number): number {
  const avgCharWidth = fontSize * 0.6;
  if (!labelMeasureCanvas) return Math.ceil(text.length * avgCharWidth);
  const ctx = labelMeasureCanvas.getContext("2d");
  if (!ctx) return Math.ceil(text.length * avgCharWidth);
  ctx.font = `${LABEL_FONT_WEIGHT} ${fontSize}px ${LABEL_FONT_FAMILY}`;
  return Math.ceil(ctx.measureText(text).width);
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
// arbitrary children. Memoized so the layout only reruns when inputs change.
export const CollisionAwareLabels = memo(function CollisionAwareLabels(
  props: CollisionAwareLabelsProps
) {
  const {
    data,
    xDomain,
    yDomain,
    colorForFamily,
    getThemeColor,
    padding,
    chartWidth,
    chartHeight,
    domainPadding,
    labelFontSize,
  } = props;
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

  const placedLabels = computeLabelLayout(layoutPoints, {
    safeBounds,
    fontSize: labelFontSize,
    measureText: measureLabelText,
    rectPadding: LABEL_RECT_PADDING,
    dotRadius: DOT_OBSTACLE_RADIUS,
  });

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
