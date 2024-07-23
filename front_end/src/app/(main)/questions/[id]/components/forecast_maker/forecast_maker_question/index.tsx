import { parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { ProjectPermissions } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

import ForecastMakerBinary from "./forecast_maker_binary";
import ForecastMakerMultipleChoice from "./forecast_maker_multiple_choice";
import ForecastMakerNumeric from "./forecast_maker_numeric";
import ForecastMakerContainer from "../container";

type Props = {
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
}) => {
  const t = useTranslations();

  const renderForecastMaker = () => {
    switch (question.type) {
      case QuestionType.Numeric:
      case QuestionType.Date:
        return (
          <ForecastMakerNumeric
            question={question}
            permission={permission}
            prevForecast={question.forecasts.my_forecasts?.slider_values}
            canPredict={
              canPredict &&
              question.open_time !== undefined &&
              parseISO(question.open_time) < new Date()
            }
            canResolve={canResolve}
          />
        );
      case QuestionType.Binary:
        return (
          <ForecastMakerBinary
            question={question}
            permission={permission}
            prevForecast={question.forecasts.my_forecasts?.slider_values}
            canPredict={
              canPredict &&
              question.open_time !== undefined &&
              parseISO(question.open_time) < new Date()
            }
            canResolve={canResolve}
          />
        );
      case QuestionType.MultipleChoice:
        return (
          <ForecastMakerMultipleChoice
            question={question}
            permission={permission}
            prevForecast={question.forecasts.my_forecasts?.slider_values}
            canPredict={
              canPredict &&
              question.open_time !== undefined &&
              parseISO(question.open_time) < new Date()
            }
            canResolve={canResolve}
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
          content: question.resolution_criteria_description,
          finePrint: question.fine_print,
        },
      ]}
    >
      {renderForecastMaker()}
    </ForecastMakerContainer>
  );
};

export default QuestionForecastMaker;
