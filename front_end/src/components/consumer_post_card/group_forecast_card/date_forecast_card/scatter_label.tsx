"use client";
import { FC } from "react";
import { VictoryLabelProps } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import { ThemeColor } from "@/types/theme";
type Props = VictoryLabelProps & {
  chartWidth: number;
  scale?: { x: (x: number) => number; y: (y: number) => number };
  onLabelOverlap: (label: string, color: ThemeColor) => void;
};
const SMALL_CHART_WIDTH = 400;
const TRUNCATE_WIDTH = 100;

const ScatterLabel: FC<Props> = ({ chartWidth, ...props }) => {
  const { getThemeColor } = useAppTheme();
  const { x, y, datum, data, scale, onLabelOverlap } = props;

  const label = props.text as string;
  if (!x || !y || chartWidth < SMALL_CHART_WIDTH || !data || !scale) {
    return null;
  }
  // check if the label is overlapping with any other label
  const scaledX = scale.x(datum?.x);
  let isOverlapping = false;
  for (const item of data) {
    if (label === item.label) {
      continue;
    }
    const scaledItemX = scale.x(item.x);
    const allowedDistance = datum?.labelWidth / 2 + item.labelWidth / 2;
    if (Math.abs(scaledX - scaledItemX) <= allowedDistance) {
      isOverlapping = true;
      onLabelOverlap(label, datum?.color);
      break;
    }
  }
  if (isOverlapping) {
    return null;
  }

  const isTruncated = datum?.labelWidth >= TRUNCATE_WIDTH;
  return (
    <foreignObject
      x={x - 50}
      y={y - (isTruncated ? 45 : 30)}
      width={100}
      height={40}
    >
      <div
        className="line-clamp-2 text-center"
        style={{
          fontSize: "12px",
          color: getThemeColor(METAC_COLORS.blue["800"]),
          maxWidth: "100px",
          overflow: "hidden",
        }}
      >
        {(label as string) ?? ""}
      </div>
    </foreignObject>
  );
};

export default ScatterLabel;
