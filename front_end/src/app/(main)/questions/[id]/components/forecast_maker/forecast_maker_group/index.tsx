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
import ForecastMakerContainer from "../container";

type Props = {
  postId: number;
  resolutionCriteria: string | null;
  finePrint: string;
  questions: QuestionWithForecasts[];
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerGroup: FC<Props> = ({
  postId,
  resolutionCriteria,
  finePrint,
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
    <ForecastMakerContainer
      title={t("MakePrediction")}
      resolutionCriteria={[
        {
          title: t("resolutionCriteria"),
          content: resolutionCriteria,
          finePrint,
        },
      ]}
    >
      {renderForecastMaker()}
    </ForecastMakerContainer>
  );
};

export default ForecastMakerGroup;
