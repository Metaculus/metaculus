import { FC } from "react";

import ForecastMakerBinary from "@/components/forecast_maker/forecast_maker_binary";
import ForecastMakerNumeric from "@/components/forecast_maker/forecast_maker_numeric";
import { QuestionType, QuestionWithForecasts } from "@/types/question";

import { MultiSliderValue } from "../sliders/multi_slider";

type Props = {
  question: QuestionWithForecasts;
};

const ForecastMaker: FC<Props> = ({ question }) => {
  switch (question.type) {
    case QuestionType.Numeric:
    case QuestionType.Date:
      return (
        <ForecastMakerNumeric
          question={question}
          prevForecast={
            question.forecasts.my_forecasts?.slider_values
              ?.forecast as MultiSliderValue[]
          }
          prevWeights={
            question.forecasts.my_forecasts?.slider_values?.weights as number[]
          }
        />
      );
    case QuestionType.Binary:
      return <ForecastMakerBinary question={question} />;
    default:
      return null;
  }
};

export default ForecastMaker;
