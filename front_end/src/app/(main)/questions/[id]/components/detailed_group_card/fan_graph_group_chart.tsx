import { useTranslations } from "next-intl";
import { FC } from "react";

import FanChart from "@/components/charts/fan_chart";
import {
  ForecastAvailability,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  getFanOptionsFromBinaryGroup,
  getFanOptionsFromContinuousGroup,
} from "@/utils/charts";

type Props = {
  questions: QuestionWithNumericForecasts[];
  height?: number;
  pointSize?: number;
  withLabel?: boolean;
  hideCP?: boolean;
  forecastAvailability?: ForecastAvailability;
  withTooltip?: boolean;
};

const FanGraphGroupChart: FC<Props> = ({
  questions,
  height,
  pointSize,
  withLabel,
  hideCP,
  forecastAvailability,
  withTooltip = true,
}) => {
  const t = useTranslations();

  return (
    <FanChart
      options={
        questions[0].type === QuestionType.Binary
          ? getFanOptionsFromBinaryGroup(questions)
          : getFanOptionsFromContinuousGroup(questions)
      }
      height={height}
      pointSize={pointSize}
      yLabel={withLabel ? t("communityPredictionLabel") : undefined}
      withTooltip={withTooltip}
      hideCP={hideCP}
      forecastAvailability={forecastAvailability}
    />
  );
};

export default FanGraphGroupChart;
