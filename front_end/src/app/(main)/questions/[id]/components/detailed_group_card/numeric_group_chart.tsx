import { useTranslations } from "next-intl";
import { FC } from "react";

import FanChart from "@/components/charts/fan_chart";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  getFanOptionsFromBinaryGroup,
  getFanOptionsFromNumericGroup,
} from "@/utils/charts";

type Props = {
  questions: QuestionWithNumericForecasts[];
};

const NumericGroupChart: FC<Props> = ({ questions }) => {
  const t = useTranslations();

  return (
    <FanChart
      options={
        questions[0].type === QuestionType.Binary
          ? getFanOptionsFromBinaryGroup(questions)
          : getFanOptionsFromNumericGroup(questions)
      }
      yLabel={t("communityPredictionLabel")}
      withTooltip
    />
  );
};

export default NumericGroupChart;
