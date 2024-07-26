import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostConditional } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

import ForecastMakerConditionalBinary from "./forecast_maker_conditional_binary";
import ForecastMakerConditionalContinuous from "./forecast_maker_conditional_continuous";
import ForecastMakerContainer from "../container";

type Props = {
  postId: number;
  postTitle: string;
  conditional: PostConditional<QuestionWithForecasts>;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerConditional: FC<Props> = ({
  postId,
  postTitle,
  conditional,
  canPredict,
  canResolve,
}) => {
  const t = useTranslations();

  const { condition, condition_child, question_yes, question_no } = conditional;
  if (question_yes.type !== question_no.type) {
    return null;
  }

  const renderForecastMaker = () => {
    switch (question_yes.type) {
      case QuestionType.Binary:
        return (
          <ForecastMakerConditionalBinary
            postId={postId}
            postTitle={postTitle}
            conditional={
              conditional as PostConditional<QuestionWithNumericForecasts>
            }
            prevYesForecast={question_yes.forecasts.my_forecasts?.slider_values}
            prevNoForecast={question_no.forecasts.my_forecasts?.slider_values}
            canPredict={
              canPredict &&
              conditional.condition_child.open_time !== undefined &&
              new Date(conditional.condition_child.open_time) <= new Date()
            }
          />
        );
      case QuestionType.Date:
      case QuestionType.Numeric:
        return (
          <ForecastMakerConditionalContinuous
            postId={postId}
            postTitle={postTitle}
            conditional={
              conditional as PostConditional<QuestionWithNumericForecasts>
            }
            prevYesForecast={question_yes.forecasts.my_forecasts?.slider_values}
            prevNoForecast={question_no.forecasts.my_forecasts?.slider_values}
            canPredict={
              canPredict &&
              conditional.condition_child.open_time !== undefined &&
              new Date(conditional.condition_child.open_time) <= new Date()
            }
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
          title: t("parentResolutionCriteria"),
          content: condition.resolution_criteria_description,
          questionTitle: condition.title,
          finePrint: condition.fine_print,
        },
        {
          title: t("childResolutionCriteria"),
          content: condition_child.resolution_criteria_description,
          questionTitle: condition_child.title,
          finePrint: condition_child.fine_print,
        },
      ]}
    >
      {renderForecastMaker()}
    </ForecastMakerContainer>
  );
};

export default ForecastMakerConditional;
