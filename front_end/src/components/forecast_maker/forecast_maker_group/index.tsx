import { useTranslations } from "next-intl";
import { FC } from "react";

import { ProjectPermissions } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

import ForecastMakerGroupBinary from "./forecast_maker_group_binary";
import ForecastMakerGroupNumeric from "./forecast_maker_group_numeric";

type Props = {
  postId: number;
  questions: QuestionWithForecasts[];
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerGroup: FC<Props> = ({
  postId,
  questions,
  permission,
  canResolve,
  canPredict,
}) => {
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
            permission={permission}
            canResolve={canResolve}
            canPredict={canPredict}
          />
        );
      case QuestionType.Numeric:
      case QuestionType.Date:
        return (
          <ForecastMakerGroupNumeric
            postId={postId}
            questions={questions as QuestionWithNumericForecasts[]}
            permission={permission}
            canResolve={canResolve}
            canPredict={canPredict}
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
