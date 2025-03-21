"use client";
import { FC } from "react";
import { VictoryLabelProps } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

type Props = VictoryLabelProps & {
  chartWidth: number;
};
const SMALL_CHART_WIDTH = 400;

const ScatterLabel: FC<Props> = ({ chartWidth, ...props }) => {
  const { getThemeColor } = useAppTheme();
  const { x, y, text } = props;
  if (!x || !y || chartWidth < SMALL_CHART_WIDTH) {
    return null;
  }
  // TODO: adjust y if text is wraped
  return (
    <foreignObject x={x - 50} y={y - 40} width={100} height={40}>
      <div
        className="line-clamp-2 text-center"
        style={{
          fontSize: "12px",
          color: getThemeColor(METAC_COLORS.blue["800"]),
          maxWidth: "100px",
          overflow: "hidden",
        }}
      >
        {(text as string) ?? ""}
      </div>
    </foreignObject>
  );
};

export default ScatterLabel;
