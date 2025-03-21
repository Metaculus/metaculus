/* eslint-disable @typescript-eslint/no-explicit-any */
import { PointProps } from "victory";

import useAppTheme from "@/hooks/use_app_theme";

const MINIMUM_DISTANCE = 5;
const OVERLAP_OFFSET = 17;
const RECTANGLE_SIZE_ADJUSTMENT = 1.7;

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

  const adjustedY = y - OVERLAP_OFFSET * Math.min(numberOfOverlaps, 4);
  return (
    <g>
      {datum.symbol === "circle" ? (
        <circle
          cx={x}
          cy={adjustedY}
          r={size}
          fill={getThemeColor(datum.color)}
          strokeWidth={2}
        />
      ) : (
        <rect
          x={x - size}
          y={adjustedY - size}
          width={size * RECTANGLE_SIZE_ADJUSTMENT}
          height={size * RECTANGLE_SIZE_ADJUSTMENT}
          transform={`rotate(45 ${x} ${adjustedY})`}
          fill={getThemeColor(datum.color)}
        />
      )}
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
