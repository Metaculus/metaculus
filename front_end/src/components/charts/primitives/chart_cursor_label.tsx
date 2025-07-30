"use client";
import { ComponentProps, FC } from "react";
import { VictoryLabel } from "victory";

import useAppTheme from "@/hooks/use_app_theme";

const FONT_SIZE = 10;

type Props = ComponentProps<typeof VictoryLabel> & {
  positionY: number;
  fill?: string;
  isActive?: boolean;
};

const ChartCursorLabel: FC<Props> = ({
  positionY,
  fill,
  isActive,
  ...props
}) => {
  const { theme } = useAppTheme();

  const estimatedTextWidth = (props.text?.toString().length ?? 0) * FONT_SIZE;
  const centeredX = (props.x ?? 0) - estimatedTextWidth / 4;
  if (!isActive) {
    return null;
  }
  return (
    <VictoryLabel
      {...props}
      style={{
        ...((props.style as any) ?? {}),
        fontSize: FONT_SIZE,
        fill: fill ?? (theme === "dark" ? "white" : "black"),
      }}
      y={positionY}
      x={centeredX}
    />
  );
};

export default ChartCursorLabel;
