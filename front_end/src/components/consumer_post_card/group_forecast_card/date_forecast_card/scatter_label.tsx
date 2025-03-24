"use client";
import { isNil } from "lodash";
import { FC, useEffect, useState } from "react";
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
  const [isOverlapping, setIsOverlapping] = useState(false);
  const label = props.text as string;

  // check if the label is overlapping with any other label
  useEffect(() => {
    if (!x || !y || chartWidth < SMALL_CHART_WIDTH || !data || !scale) {
      return;
    }
    const scaledX = scale.x(datum?.x);
    for (const item of data) {
      if (label === item.label) {
        continue;
      }
      const scaledItemX = scale.x(item.x);
      const allowedDistance = datum?.labelWidth / 2 + item.labelWidth / 2;
      if (Math.abs(scaledX - scaledItemX) <= allowedDistance) {
        setIsOverlapping(true);
        onLabelOverlap(label, datum?.color);
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isOverlapping || chartWidth < SMALL_CHART_WIDTH || isNil(x) || isNil(y)) {
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
        className="line-clamp-2 max-w-[100px] overflow-hidden text-center text-xs"
        style={{
          color: getThemeColor(METAC_COLORS.blue["800"]),
        }}
      >
        {(label as string) ?? ""}
      </div>
    </foreignObject>
  );
};

export default ScatterLabel;
