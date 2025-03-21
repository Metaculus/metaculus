import { PointProps } from "victory";

import useAppTheme from "@/hooks/use_app_theme";

const PredictionSymbol: React.FC<PointProps & { chartWidth: number }> = (
  props
) => {
  const { getThemeColor } = useAppTheme();
  const { x, y, datum, size, style, scale, chartWidth } = props;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof size !== "number"
  ) {
    return null;
  }
  const stroke = style.stroke;
  const adjustedY = chartWidth < 400 ? y - 10 : y;

  return (
    <g>
      <circle
        cx={x}
        cy={adjustedY}
        r={size}
        stroke={stroke}
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
