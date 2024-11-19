import { useTranslations } from "next-intl";
import { FC } from "react";

import FanChart from "@/components/charts/fan_chart";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
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
  withTooltip?: boolean;
  isCPRevealed?: boolean;
  cpRevealTime?: string;
};

const NumericGroupChart: FC<Props> = ({
  questions,
  height,
  pointSize,
  withLabel,
  hideCP,
  withTooltip = true,
  isCPRevealed = true,
  cpRevealTime,
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
      isCPRevealed={isCPRevealed}
      cpRevealTime={cpRevealTime}
    />
  );
};

export default NumericGroupChart;
