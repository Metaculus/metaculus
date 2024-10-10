import { useTranslations } from "next-intl";
import { ComponentProps, FC } from "react";
import { VictoryLabel } from "victory";

import { Quartiles, QuestionWithNumericForecasts } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";

const HEIGHT = 70;

type Props = ComponentProps<typeof VictoryLabel> & {
  items: Record<
    string,
    { quartiles: Quartiles; question: QuestionWithNumericForecasts }
  >;
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

  const activeItem = items[option];
  if (!activeItem) {
    return null;
  }

  const quartiles = items[option].quartiles;
  const question = items[option].question;

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
            value={getDisplayValue(
              quartiles.upper75,
              question.type,
              question.scaling
            )}
          />
          <TooltipItem
            label={t("fanGraphSecondQuartileLabel")}
            value={getDisplayValue(
              quartiles.median,
              question.type,
              question.scaling
            )}
          />
          <TooltipItem
            label={t("fanGraphFirstQuartileLabel")}
            value={getDisplayValue(
              quartiles.lower25,
              question.type,
              question.scaling
            )}
          />
        </div>
      </foreignObject>
    </g>
  );
};

const TooltipItem: FC<{ label: string; value: string }> = ({
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
