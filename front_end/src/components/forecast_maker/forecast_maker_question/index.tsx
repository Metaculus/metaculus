import { FC } from "react";
import { boolean } from "zod";

import { ProjectPermissions } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

import ForecastMakerBinary from "./forecast_maker_binary";
import ForecastMakerMultipleChoice from "./forecast_maker_multiple_choice";
import ForecastMakerNumeric from "./forecast_maker_numeric";

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
  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
      return (
        <ForecastMakerNumeric
          question={question}
          permission={permission}
          prevForecast={question.forecasts.my_forecasts?.slider_values}
          canPredict={canPredict}
          canResolve={canResolve}
        />
      );
    case QuestionType.Binary:
      return (
        <ForecastMakerBinary
          question={question}
          permission={permission}
          prevForecast={question.forecasts.my_forecasts?.slider_values}
          canPredict={canPredict}
          canResolve={canResolve}
        />
      );
    case QuestionType.MultipleChoice:
      return (
        <ForecastMakerMultipleChoice
          question={question}
          permission={permission}
          prevForecast={question.forecasts.my_forecasts?.slider_values}
          canPredict={canPredict}
          canResolve={canResolve}
        />
      );
    default:
      return null;
  }
};

export default QuestionForecastMaker;
