import { useTranslations } from "next-intl";
import { FC } from "react";

import ForecastMakerConditionalNumeric from "@/components/forecast_maker/forecast_maker_conditional/forecast_maker_conditional_numeric";
import { PostConditional } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

import ForecastMakerConditionalBinary from "./forecast_maker_conditional_binary";

type Props = {
  postId: number;
  conditional: PostConditional<QuestionWithForecasts>;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerConditional: FC<Props> = ({
  postId,
  conditional,
  canPredict,
  canResolve,
}) => {
  const t = useTranslations();

  const { question_yes, question_no } = conditional;
  if (question_yes.type !== question_no.type) {
    return null;
  }

  const renderForecastMaker = () => {
    switch (question_yes.type) {
      case QuestionType.Binary:
        return (
          <ForecastMakerConditionalBinary
            postId={postId}
            conditional={
              conditional as PostConditional<QuestionWithNumericForecasts>
            }
            prevYesForecast={question_yes.forecasts.my_forecasts?.slider_values}
            prevNoForecast={question_no.forecasts.my_forecasts?.slider_values}
            canPredict={canPredict}
          />
        );
      case QuestionType.Date:
      case QuestionType.Numeric:
        return (
          <ForecastMakerConditionalNumeric
            postId={postId}
            conditional={
              conditional as PostConditional<QuestionWithNumericForecasts>
            }
            prevYesForecast={question_yes.forecasts.my_forecasts?.slider_values}
            prevNoForecast={question_no.forecasts.my_forecasts?.slider_values}
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

export default ForecastMakerConditional;
