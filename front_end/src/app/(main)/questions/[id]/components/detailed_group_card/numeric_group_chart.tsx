import { useTranslations } from "next-intl";
import { FC } from "react";

import FanChart from "@/components/charts/fan_chart";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getFanOptionsFromNumericGroup } from "@/utils/charts";

type Props = {
  questions: QuestionWithNumericForecasts[];
};

const NumericGroupChart: FC<Props> = ({ questions }) => {
  const t = useTranslations();

  return (
    <FanChart
      options={getFanOptionsFromNumericGroup(questions)}
      yLabel={t("communityPredictionLabel")}
      withTooltip
    />
  );
};

export default NumericGroupChart;
