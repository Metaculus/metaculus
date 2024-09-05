import { parseISO } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import { ProjectPermissions } from "@/types/post";
import {
  PredictionInputMessage,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";
import { formatResolution } from "@/utils/questions";

import ForecastMakerBinary from "./forecast_maker_binary";
import ForecastMakerContinuous from "./forecast_maker_continuous";
import ForecastMakerMultipleChoice from "./forecast_maker_multiple_choice";
import ForecastMakerContainer from "../container";
import ScoreDisplay from "../resolution/score_display";

type Props = {
  postId: number;
  question: QuestionWithForecasts;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage: PredictionInputMessage;
};

const QuestionForecastMaker: FC<Props> = ({
  question,
  permission,
  canPredict,
  canResolve,
  postId,
  predictionMessage,
}) => {
  const t = useTranslations();

  return (
    <ForecastMakerContainer
      resolutionCriteria={[
        {
          title: t("resolutionCriteria"),
          content: question.resolution_criteria,
          finePrint: question.fine_print,
        },
      ]}
    >
      {(question.type === QuestionType.Numeric ||
        question.type === QuestionType.Date) && (
        <>
          <ForecastMakerContinuous
            postId={postId}
            question={question}
            permission={permission}
            prevForecast={question.my_forecasts?.latest?.slider_values}
            canPredict={
              canPredict &&
              question.open_time !== undefined &&
              parseISO(question.open_time) < new Date()
            }
            canResolve={canResolve}
            predictionMessage={predictionMessage}
          />
          <QuestionResolutionText question={question} />
        </>
      )}
      {question.type === QuestionType.Binary && (
        <>
          <ForecastMakerBinary
            postId={postId}
            question={question}
            permission={permission}
            prevForecast={question.my_forecasts?.latest?.slider_values}
            canPredict={
              canPredict &&
              question.open_time !== undefined &&
              parseISO(question.open_time) < new Date()
            }
            canResolve={canResolve}
            predictionMessage={predictionMessage}
          />
          <QuestionResolutionText question={question} />
        </>
      )}
      {question.type === QuestionType.MultipleChoice && (
        <>
          <ForecastMakerMultipleChoice
            postId={postId}
            question={question}
            permission={permission}
            canPredict={
              canPredict &&
              question.open_time !== undefined &&
              parseISO(question.open_time) < new Date()
            }
            canResolve={canResolve}
          />
          <QuestionResolutionText question={question} />
        </>
      )}
      <ScoreDisplay question={question} />
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
    case QuestionType.Date:
    case QuestionType.Numeric:
      resolutionText = t("resolutionDescriptionContinuous");
  }

  const formattedResolution = formatResolution(
    question.resolution,
    question.type,
    locale
  );

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
