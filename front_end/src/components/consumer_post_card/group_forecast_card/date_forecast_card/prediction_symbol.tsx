/* eslint-disable @typescript-eslint/no-explicit-any */
import { PointProps } from "victory";

import useAppTheme from "@/hooks/use_app_theme";

const MINIMUM_DISTANCE = 5;
const PredictionSymbol: React.FC<PointProps> = (props) => {
  const { getThemeColor } = useAppTheme();
  const { x, y, datum, size, scale, data } = props;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof size !== "number"
  ) {
    return null;
  }
  // adjust the y position if CP is overlapping with other symbols
  const scaledX = scale.x(datum.x);
  const symbolIndex = data.findIndex((item: any) => item.label === datum.label);
  let numberOfOverlaps = 0;
  data.forEach((item: any, index: number) => {
    if (index <= symbolIndex) {
      return;
    }
    const scaledItemX = scale.x(item.x);
    const distance = Math.abs(scaledX - scaledItemX);
    if (distance < MINIMUM_DISTANCE) {
      numberOfOverlaps++;
    }
  });

  const adjustedY = y - 17 * numberOfOverlaps;
  return (
    <g>
      <circle
        cx={x}
        cy={adjustedY}
        r={size}
        fill={getThemeColor(datum.color)}
        strokeWidth={2}
      />
      <line
        x1={x}
        y1={adjustedY}
        x2={x}
        y2={scale.y(0)}
        strokeWidth={3}
        stroke={getThemeColor(datum.color)}
      />
    </g>
  );
};

export default PredictionSymbol;
