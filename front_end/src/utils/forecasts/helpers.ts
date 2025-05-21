import { isNil } from "lodash";

import { ContinuousForecastInputType } from "@/types/charts";
import {
  PostWithForecasts,
  PredictionFlowPost,
  QuestionStatus,
} from "@/types/post";
import {
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
  Quantile,
  Question,
} from "@/types/question";
import { getSliderNumericForecastDataset } from "@/utils/forecasts/dataset";
import { computeQuartilesFromCDF } from "@/utils/math";

export function isAllQuantileComponentsDirty(
  components: DistributionQuantileComponent
): boolean {
  return components.every((component) => {
    if (
      (component.quantile === Quantile.lower ||
        component.quantile === Quantile.upper) &&
      component.value === 0
    ) {
      return true;
    }
    return component.isDirty;
  });
}

export function populateQuantileComponents(
  components: DistributionQuantileComponent
): DistributionQuantileComponent {
  return components.map((component) => ({
    ...component,
    isDirty: false,
  }));
}

export function clearQuantileComponents(
  components: DistributionQuantileComponent
): DistributionQuantileComponent {
  return components.map((component) => ({
    quantile: component.quantile,
    value: component.value,
  }));
}

export const getNormalizedContinuousForecast = (
  forecast: DistributionSliderComponent[] | null | undefined
): DistributionSliderComponent[] =>
  forecast ?? [
    {
      left: 0.4,
      center: 0.5,
      right: 0.6,
      weight: 1,
    },
  ];

export function getUserContinuousQuartiles(
  components?: DistributionSliderComponent[],
  question?: Question
) {
  if (
    !components?.length ||
    typeof question?.open_lower_bound === "undefined" ||
    typeof question?.open_upper_bound === "undefined"
  ) {
    return null;
  }

  const dataset = getSliderNumericForecastDataset(
    components,
    !!question.open_lower_bound,
    !!question.open_upper_bound
  );

  return computeQuartilesFromCDF(dataset.cdf);
}

export const isSliderForecast = (
  input: DistributionSlider | DistributionQuantile | null | undefined
): input is DistributionSlider =>
  input?.type === ContinuousForecastInputType.Slider;

export const isQuantileForecast = (
  input: DistributionSlider | DistributionQuantile | null | undefined
): input is DistributionQuantile =>
  input?.type === ContinuousForecastInputType.Quantile;

export const isPostOpenQuestionPredicted = (
  post: PostWithForecasts | PredictionFlowPost,
  config?: {
    checkAllSubquestions?: boolean;
    treatClosedAsPredicted?: boolean;
  }
) => {
  const { checkAllSubquestions = true, treatClosedAsPredicted = true } =
    config ?? {};
  const openQuestionConfig = {
    treatClosedAsPredicted,
  };
  if (post.question) {
    return isOpenQuestionPredicted(post.question, openQuestionConfig);
  }
  if (post.group_of_questions) {
    return checkAllSubquestions
      ? post.group_of_questions.questions.every(
          (question) =>
            question.status !== QuestionStatus.OPEN ||
            isOpenQuestionPredicted(question, openQuestionConfig)
        )
      : post.group_of_questions.questions.some((question) =>
          isOpenQuestionPredicted(question, openQuestionConfig)
        );
  }
  if (post.conditional) {
    const { question_no, question_yes } = post.conditional;
    return checkAllSubquestions
      ? isOpenQuestionPredicted(question_no, openQuestionConfig) &&
          isOpenQuestionPredicted(question_yes, openQuestionConfig)
      : isOpenQuestionPredicted(question_no, openQuestionConfig) ||
          isOpenQuestionPredicted(question_yes, openQuestionConfig);
  }
  return false;
};

export function isOpenQuestionPredicted(
  question: Question,
  config?: { treatClosedAsPredicted?: boolean }
) {
  const { treatClosedAsPredicted = true } = config ?? {};
  return (
    (treatClosedAsPredicted
      ? question.status !== QuestionStatus.OPEN
      : false) ||
    (!isNil(question.my_forecasts?.latest) &&
      !question.my_forecasts?.latest.end_time) ||
    (!isNil(question.my_forecast?.latest) &&
      !question.my_forecast?.latest.end_time)
  );
}
