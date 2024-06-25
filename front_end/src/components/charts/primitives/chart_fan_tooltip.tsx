import { useTranslations } from "next-intl";
import { ComponentProps, FC } from "react";
import { VictoryLabel } from "victory";

import { Quartiles } from "@/types/question";

const HEIGHT = 70;

type Props = ComponentProps<typeof VictoryLabel> & {
  items: Record<string, Quartiles>;
  width: number;
  chartHeight: number;
};

const ChartFanTooltip: FC<Props> = ({
  items,
  width,
  chartHeight,
  ...props
}) => {
  const t = useTranslations();

  const { x, y, datum } = props;
  const option = datum?.xName;

  if (typeof option !== "string" || !x || !y) {
    return null;
  }

  const quartiles = items[option];
  if (!quartiles) {
    return null;
  }

  const padding = 10;
  const position = y + padding + HEIGHT > chartHeight ? "top" : "bottom";

  return (
    <g style={{ pointerEvents: "none" }}>
      <foreignObject
        x={x - width / 2}
        y={position === "bottom" ? y + padding : y - HEIGHT}
        width={width}
        height={HEIGHT}
      >
        <div className="flex flex-col rounded-sm border border-olive-700 bg-gray-0 p-1 dark:border-olive-700-dark dark:bg-gray-0-dark">
          <TooltipItem
            label={t("fanGraphThirdQuartileLabel")}
            value={quartiles.upper75}
          />
          <TooltipItem
            label={t("fanGraphSecondQuartileLabel")}
            value={quartiles.median}
          />
          <TooltipItem
            label={t("fanGraphFirstQuartileLabel")}
            value={quartiles.lower25}
          />
        </div>
      </foreignObject>
    </g>
  );
};

const TooltipItem: FC<{ label: string; value: number }> = ({
  label,
  value,
}) => (
  <div className="flex justify-between text-xs">
    <div>{label}</div>
    <div className="font-semibold text-olive-700 dark:text-olive-700-dark">
      {value}
    </div>
  </div>
);

export default ChartFanTooltip;
