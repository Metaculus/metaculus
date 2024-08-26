import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { sortGroupPredictionOptions } from "@/utils/questions";

import ForecastMakerGroupBinary from "./forecast_maker_group_binary";
import ForecastMakerGroupContinuous from "./forecast_maker_group_continuous";
import ForecastMakerContainer from "../container";

type Props = {
  resolutionCriteria: string | null;
  finePrint: string;
  questions: QuestionWithForecasts[];
  post: PostWithForecasts;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerGroup: FC<Props> = ({
  post,
  resolutionCriteria,
  finePrint,
  questions,
  canResolve,
  canPredict,
}) => {
  const t = useTranslations();

  const tileType = questions.at(0)?.type;

  if (!tileType) {
    return null;
  }

  return (
    <ForecastMakerContainer
      resolutionCriteria={[
        {
          title: t("resolutionCriteria"),
          content: resolutionCriteria,
          finePrint,
        },
      ]}
    >
      {tileType === QuestionType.Binary && (
        <ForecastMakerGroupBinary
          post={post}
          questions={sortGroupPredictionOptions(
            questions as QuestionWithNumericForecasts[]
          )}
          canResolve={canResolve}
          canPredict={canPredict}
        />
      )}
      {(tileType === QuestionType.Date ||
        tileType === QuestionType.Numeric) && (
        <ForecastMakerGroupContinuous
          post={post}
          questions={questions as QuestionWithNumericForecasts[]}
          canResolve={canResolve}
          canPredict={canPredict}
        />
      )}
    </ForecastMakerContainer>
  );
};

export default ForecastMakerGroup;
