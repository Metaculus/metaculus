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

import { isOpenPredictedQuestion } from "../questions/helpers";

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
  checkAllSubquestions?: boolean
) => {
  if (post.question) {
    return isOpenPredictedQuestion(post.question);
  }
  if (post.group_of_questions) {
    return checkAllSubquestions
      ? post.group_of_questions.questions.every(
          (question) =>
            question.status !== QuestionStatus.OPEN ||
            isOpenPredictedQuestion(question)
        )
      : post.group_of_questions.questions.some((question) =>
          isOpenPredictedQuestion(question)
        );
  }
  if (post.conditional) {
    const { question_no, question_yes } = post.conditional;
    return checkAllSubquestions
      ? isOpenPredictedQuestion(question_no) &&
          isOpenPredictedQuestion(question_yes)
      : isOpenPredictedQuestion(question_no) ||
          isOpenPredictedQuestion(question_yes);
  }
  return false;
};
