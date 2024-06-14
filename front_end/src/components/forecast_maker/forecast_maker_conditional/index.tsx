import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostConditional } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

import ForecastMakerConditionalBinary from "./forecast_maker_conditional_binary";

type Props = {
  conditional: PostConditional<QuestionWithForecasts>;
};

const ForecastMakerConditional: FC<Props> = ({ conditional }) => {
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
            conditional={
              conditional as PostConditional<QuestionWithNumericForecasts>
            }
            prevYesForecast={question_yes.forecasts.my_forecasts?.slider_values}
            prevNoForecast={question_no.forecasts.my_forecasts?.slider_values}
          />
        );
      case QuestionType.Date:
      case QuestionType.Numeric:
        return <>TODO: numeric picker</>;
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
