import { parseISO } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import { ProjectPermissions } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { formatResolution } from "@/utils/questions";

import ForecastMakerBinary from "./forecast_maker_binary";
import ForecastMakerContinuous from "./forecast_maker_continuous";
import ForecastMakerMultipleChoice from "./forecast_maker_multiple_choice";
import ForecastMakerContainer from "../container";

type Props = {
  postId: number;
  question: QuestionWithForecasts;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
};

const QuestionForecastMaker: FC<Props> = ({
  question,
  permission,
  canPredict,
  canResolve,
  postId,
}) => {
  const t = useTranslations();

  const renderForecastMaker = () => {
    switch (question.type) {
      case QuestionType.Numeric:
      case QuestionType.Date:
        return (
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
            />
            <QuestionResolutionText question={question} />
          </>
        );
      case QuestionType.Binary:
        return (
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
            />
            <QuestionResolutionText question={question} />
          </>
        );
      case QuestionType.MultipleChoice:
        return (
          <>
            <ForecastMakerMultipleChoice
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
            />
            <QuestionResolutionText question={question} />
          </>
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
          content: question.resolution_criteria,
          finePrint: question.fine_print,
        },
      ]}
    >
      {renderForecastMaker()}
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
        <strong className="text-purple-800 dark:text-purple-800-dark">
          {formattedResolution}
        </strong>
      </p>
    </div>
  );
};

export default QuestionForecastMaker;
