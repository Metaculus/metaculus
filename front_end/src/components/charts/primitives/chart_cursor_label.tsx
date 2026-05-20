"use client";
import { ComponentProps, FC } from "react";
import { VictoryLabel, VictoryLabelProps } from "victory";

import useAppTheme from "@/hooks/use_app_theme";

const FONT_SIZE = 10;

type Props = ComponentProps<typeof VictoryLabel> & {
  positionY: number;
  fill?: string;
  isActive?: boolean;
  chartWidth?: number;
  leftPadding?: number;
  rightPadding?: number;
};

const ChartCursorLabel: FC<Props> = ({
  positionY,
  fill,
  isActive,
  style,
  chartWidth,
  leftPadding = 0,
  rightPadding = 0,
  ...props
}) => {
  const { theme } = useAppTheme();

  const text = props.text?.toString() ?? "";
  const estimatedTextWidth = text.length * FONT_SIZE;
  let centeredX = (props.x ?? 0) - estimatedTextWidth / 4;

  if (isActive === false || (isActive === undefined && !text)) {
    return null;
  }

  // Without VictoryPortal the label is rendered inside the chart's SVG and
  // clipped at the edges. Clamp the (middle-anchored) label position so the
  // full text stays inside the chart bounds.
  if (chartWidth !== undefined && estimatedTextWidth > 0) {
    const halfWidth = estimatedTextWidth / 2;
    const minX = leftPadding + halfWidth;
    const maxX = chartWidth - rightPadding - halfWidth;
    if (maxX > minX) {
      centeredX = Math.min(maxX, Math.max(minX, centeredX));
    }
  }

  const baseStyleObj = (Array.isArray(style) ? style[0] : style) ?? {};

  const mergedStyle: VictoryLabelProps["style"] = {
    ...baseStyleObj,
    fontSize: FONT_SIZE,
    fill: fill ?? (theme === "dark" ? "white" : "black"),
  };

  return (
    <VictoryLabel {...props} style={mergedStyle} y={positionY} x={centeredX} />
  );
};

export default ChartCursorLabel;
