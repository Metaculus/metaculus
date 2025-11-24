import { useLocale, useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import { ContinuousQuestionTypes } from "@/constants/questions";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { formatResolution } from "@/utils/formatters/resolution";

import ForecastMakerBinary from "./forecast_maker_binary";
import ForecastMakerContinuous from "./forecast_maker_continuous";
import ForecastMakerMultipleChoice from "./forecast_maker_multiple_choice";
import ForecastMakerContainer from "../container";

type Props = {
  post: PostWithForecasts;
  question: QuestionWithForecasts;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage: ReactNode;
  onPredictionSubmit?: () => void;
};

const QuestionForecastMaker: FC<Props> = ({
  question,
  permission,
  canPredict,
  canResolve,
  post,
  predictionMessage,
  onPredictionSubmit,
}) => {
  return (
    <ForecastMakerContainer>
      {ContinuousQuestionTypes.some((type) => type === question.type) && (
        <>
          <ForecastMakerContinuous
            post={post}
            question={question as QuestionWithNumericForecasts}
            permission={permission}
            canPredict={canPredict}
            canResolve={canResolve}
            predictionMessage={predictionMessage}
            onPredictionSubmit={onPredictionSubmit}
          />
          <QuestionResolutionText question={question} />
        </>
      )}
      {question.type === QuestionType.Binary && (
        <>
          <ForecastMakerBinary
            post={post}
            question={question}
            permission={permission}
            canPredict={canPredict}
            canResolve={canResolve}
            predictionMessage={predictionMessage}
            onPredictionSubmit={onPredictionSubmit}
          />
          <QuestionResolutionText question={question} />
        </>
      )}
      {question.type === QuestionType.MultipleChoice && (
        <>
          <ForecastMakerMultipleChoice
            post={post}
            question={question}
            permission={permission}
            canPredict={canPredict}
            canResolve={canResolve}
            predictionMessage={predictionMessage}
            onPredictionSubmit={onPredictionSubmit}
          />
          <QuestionResolutionText question={question} />
        </>
      )}
    </ForecastMakerContainer>
  );
};

const QuestionResolutionText = ({
  question,
}: {
  question: QuestionWithForecasts;
}) => {
  const t = useTranslations();
  const locale = useLocale();

  if (!question.resolution) {
    return null;
  }

  let resolutionText = "";
  switch (question.type) {
    case QuestionType.Binary:
      resolutionText = t("resolutionDescriptionBinary");
      break;
    case QuestionType.MultipleChoice:
      resolutionText = t("resolutionDescriptionMultipleChoice");
      break;
    case QuestionType.Numeric:
    case QuestionType.Discrete:
    case QuestionType.Date:
      resolutionText = t("resolutionDescriptionContinuous");
  }

  const formattedResolution = formatResolution({
    resolution: question.resolution,
    questionType: question.type,
    locale,
    scaling: question.scaling,
    unit: question.unit,
    actual_resolve_time: question.actual_resolve_time ?? null,
  });

  return (
    <div className="mb-3 text-gray-600 dark:text-gray-600-dark">
      <p className="my-1 flex justify-center gap-1 text-base">
        {resolutionText}
        <strong
          className="text-purple-800 dark:text-purple-800-dark"
          suppressHydrationWarning
        >
          {formattedResolution}
        </strong>
      </p>
    </div>
  );
};

export default QuestionForecastMaker;
