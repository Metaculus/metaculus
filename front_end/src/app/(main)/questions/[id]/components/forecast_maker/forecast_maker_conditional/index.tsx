import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostConditional, PostWithForecasts } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

import ForecastMakerConditionalBinary from "./forecast_maker_conditional_binary";
import ForecastMakerConditionalContinuous from "./forecast_maker_conditional_continuous";
import ForecastMakerContainer from "../container";

type Props = {
  post: PostWithForecasts;
  conditional: PostConditional<QuestionWithForecasts>;
  canPredict: boolean;
};

const ForecastMakerConditional: FC<Props> = ({
  post,
  conditional,
  canPredict,
}) => {
  const t = useTranslations();

  const { id: postId, title: postTitle } = post;
  const { condition, condition_child, question_yes, question_no } = conditional;

  if (question_yes.type !== question_no.type) {
    return null;
  }
  const parentSuccessfullyResolved =
    condition.resolution === "yes" || condition.resolution === "no";
  const parentIsClosed = condition.actual_close_time
    ? new Date(condition.actual_close_time).getTime() < Date.now()
    : false;
  const conditionClosedOrResolved =
    parentSuccessfullyResolved || parentIsClosed;
  return (
    <ForecastMakerContainer
      resolutionCriteria={[
        {
          title: t("parentResolutionCriteria"),
          content: condition.resolution_criteria,
          questionTitle: condition.title,
          finePrint: condition.fine_print,
        },
        {
          title: t("childResolutionCriteria"),
          content: condition_child.resolution_criteria,
          questionTitle: condition_child.title,
          finePrint: condition_child.fine_print,
        },
      ]}
    >
      {question_yes.type === QuestionType.Binary && (
        <ForecastMakerConditionalBinary
          postId={postId}
          postTitle={postTitle}
          conditional={
            conditional as PostConditional<QuestionWithNumericForecasts>
          }
          prevYesForecast={
            question_yes.my_forecasts?.latest?.forecast_values[1]
          }
          prevNoForecast={question_no.my_forecasts?.latest?.forecast_values[1]}
          canPredict={
            canPredict &&
            conditionClosedOrResolved &&
            conditional.condition_child.open_time !== undefined &&
            new Date(conditional.condition_child.open_time) <= new Date()
          }
        />
      )}
      {(question_yes.type === QuestionType.Date ||
        question_yes.type === QuestionType.Numeric) && (
        <ForecastMakerConditionalContinuous
          postId={postId}
          postTitle={postTitle}
          conditional={
            conditional as PostConditional<QuestionWithNumericForecasts>
          }
          prevYesForecast={question_yes.my_forecasts?.latest?.slider_values}
          prevNoForecast={question_no.my_forecasts?.latest?.slider_values}
          canPredict={
            canPredict &&
            conditionClosedOrResolved &&
            conditional.condition_child.open_time !== undefined &&
            new Date(conditional.condition_child.open_time) <= new Date()
          }
        />
      )}
    </ForecastMakerContainer>
  );
};

export default ForecastMakerConditional;
