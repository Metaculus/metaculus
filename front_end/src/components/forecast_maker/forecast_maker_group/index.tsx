import { useTranslations } from "next-intl";
import { FC } from "react";

import ForecastMakerGroupBinary from "@/components/forecast_maker/forecast_maker_group/forecast_maker_group_binary";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

type Props = {
  postId: number;
  questions: QuestionWithForecasts[];
};

const ForecastMakerGroup: FC<Props> = ({ postId, questions }) => {
  const t = useTranslations();

  const renderForecastMaker = () => {
    const tileType = questions.at(0)?.type;

    if (!tileType) {
      return null;
    }

    switch (tileType) {
      case QuestionType.Binary:
        return (
          <ForecastMakerGroupBinary
            postId={postId}
            questions={questions as QuestionWithNumericForecasts[]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section className="bg-blue-200 p-3 dark:bg-blue-200-dark">
      <h3 className="m-0 text-base font-normal leading-5">
        {t("MakePrediction")}
      </h3>
      <div className="mt-3">{renderForecastMaker()}</div>
    </section>
  );
};

export default ForecastMakerGroup;
