import { isNil } from "lodash";

import { ContinuousForecastInputType } from "@/types/charts";
import {
  PostWithForecasts,
  PredictionFlowPost,
  QuestionStatus,
} from "@/types/post";
import {
  AggregateForecast,
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
  Quantile,
  Question,
  UserForecast,
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

  const dataset = getSliderNumericForecastDataset(components, question);

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
    treatWithdrawnAsPredicted?: boolean;
  }
) => {
  const {
    checkAllSubquestions = true,
    treatClosedAsPredicted = true,
    treatWithdrawnAsPredicted = false,
  } = config ?? {};
  const openQuestionConfig = {
    treatClosedAsPredicted,
    treatWithdrawnAsPredicted,
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

export function isForecastActive(forecast: UserForecast | AggregateForecast) {
  return isNil(forecast.end_time) || forecast.end_time * 1000 > Date.now();
}

export function isOpenQuestionPredicted(
  question: Question,
  config?: {
    treatClosedAsPredicted?: boolean;
    treatWithdrawnAsPredicted?: boolean;
  }
) {
  const { treatClosedAsPredicted = true, treatWithdrawnAsPredicted = false } =
    config ?? {};
  const isForecastPredicted = (forecast: UserForecast | undefined) =>
    !isNil(forecast) &&
    (treatWithdrawnAsPredicted || isForecastActive(forecast));

  return (
    (treatClosedAsPredicted
      ? question.status !== QuestionStatus.OPEN
      : false) ||
    (question.status === QuestionStatus.OPEN &&
      isForecastPredicted(question.my_forecasts?.latest)) ||
    (question.status === QuestionStatus.OPEN &&
      isForecastPredicted(question.my_forecast?.latest))
  );
}
