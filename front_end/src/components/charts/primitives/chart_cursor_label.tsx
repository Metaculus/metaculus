"use client";
import { ComponentProps, FC } from "react";
import { VictoryLabel, VictoryLabelProps } from "victory";

import { CHART_FONT_STYLE } from "@/constants/chart_typography";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

type Props = ComponentProps<typeof VictoryLabel> & {
  positionY: number;
  fill?: string;
  isActive?: boolean;
};

const ChartCursorLabel: FC<Props> = ({
  positionY,
  fill,
  isActive,
  style,
  ...props
}) => {
  const { getThemeColor } = useAppTheme();

  const text = props.text?.toString() ?? "";
  const estimatedTextWidth = text.length * CHART_FONT_STYLE.cursor.fontSize;
  const centeredX = (props.x ?? 0) - estimatedTextWidth / 4;
  if (isActive === false || (isActive === undefined && !text)) {
    return null;
  }

  const baseStyleObj = (Array.isArray(style) ? style[0] : style) ?? {};

  const mergedStyle: VictoryLabelProps["style"] = {
    ...baseStyleObj,
    ...CHART_FONT_STYLE.cursor,
    fill: fill ?? getThemeColor(METAC_COLORS.gray["700"]),
  };

  return (
    <VictoryLabel {...props} style={mergedStyle} y={positionY} x={centeredX} />
  );
};

export default ChartCursorLabel;
