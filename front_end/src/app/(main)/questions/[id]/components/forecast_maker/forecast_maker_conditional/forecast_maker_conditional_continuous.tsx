"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { ErrorResponse } from "@/types/fetch";
import { Post, PostConditional } from "@/types/post";
import {
  PredictionInputMessage,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import {
  extractPrevNumericForecastValue,
  getNumericForecastDataset,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

import { sendGAConditionalPredictEvent } from "./ga_events";
import { useHideCP } from "../../cp_provider";
import ConditionalForecastTable, {
  ConditionalTableOption,
} from "../conditional_forecast_table";
import ContinuousSlider from "../continuous_slider";
import NumericForecastTable from "../numeric_table";
import PredictButton from "../predict_button";
import ScoreDisplay from "../resolution/score_display";

type Props = {
  postId: number;
  postTitle: string;
  conditional: PostConditional<QuestionWithNumericForecasts>;
  prevYesForecast?: any;
  prevNoForecast?: any;
  canPredict: boolean;
  predictionMessage: PredictionInputMessage;
  projects: Post["projects"];
};

const ForecastMakerConditionalContinuous: FC<Props> = ({
  postId,
  postTitle,
  conditional,
  prevYesForecast,
  prevNoForecast,
  canPredict,
  predictionMessage,
  projects,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hideCP } = useHideCP();

  const { condition, condition_child, question_yes, question_no } = conditional;
  const questionYesId = question_yes.id;
  const questionNoId = question_no.id;

  const prevYesForecastValue = extractPrevNumericForecastValue(prevYesForecast);
  const prevNoForecastValue = extractPrevNumericForecastValue(prevNoForecast);
  const hasUserForecast =
    !!prevYesForecastValue.forecast || !!prevNoForecastValue.forecast;

  const [questionOptions, setQuestionOptions] = useState<
    Array<
      ConditionalTableOption & {
        question: QuestionWithNumericForecasts;
        sliderForecast: MultiSliderValue[];
        weights: number[];
      }
    >
  >(() => [
    {
      id: questionYesId,
      name: t("ifYes"),
      value: getTableValue(
        prevYesForecastValue?.forecast,
        prevYesForecastValue?.weights,
        question_yes.open_lower_bound,
        question_yes.open_upper_bound
      ),
      sliderForecast: getSliderValue(prevYesForecastValue?.forecast),
      weights: getWeightsValue(prevYesForecastValue?.weights),
      isDirty: false,
      question: question_yes,
    },
    {
      id: questionNoId,
      name: t("ifNo"),
      value: getTableValue(
        prevNoForecastValue?.forecast,
        prevNoForecastValue?.weights,
        question_no.open_lower_bound,
        question_no.open_upper_bound
      ),
      sliderForecast: getSliderValue(prevNoForecastValue?.forecast),
      weights: getWeightsValue(prevNoForecastValue?.weights),
      isDirty: false,
      question: question_no,
    },
  ]);
  const [activeTableOption, setActiveTableOption] = useState(
    questionOptions.at(0)?.id ?? null
  );
  const activeQuestion = useMemo(
    () => [question_yes, question_no].find((q) => q.id === activeTableOption),
    [activeTableOption, question_yes, question_no]
  );
  const activeOptionData = useMemo(
    () => questionOptions.find((option) => option.id === activeTableOption),
    [activeTableOption, questionOptions]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse[]>([]);
  const isPickerDirty = useMemo(
    () => questionOptions.some((option) => option.isDirty),
    [questionOptions]
  );
  const questionsToSubmit = useMemo(
    () => questionOptions.filter((option) => option.value !== null),
    [questionOptions]
  );

  const copyForecastButton = useMemo(() => {
    if (!activeTableOption) return null;

    const inactiveOption = questionOptions.find(
      (option) => option.id !== activeTableOption
    );

    if (!inactiveOption || inactiveOption.value === null) {
      return null;
    }

    return {
      label: t("copyFromBranch", { branch: inactiveOption.name.toUpperCase() }),
      fromQuestionId: inactiveOption.id,
      toQuestionId: activeTableOption,
    };
  }, [activeTableOption, questionOptions, t]);

  const copyForecast = useCallback(
    (fromQuestionId: number, toQuestionId: number) => {
      setQuestionOptions((prev) =>
        prev.map((prevChoice) => {
          if (prevChoice.id === toQuestionId) {
            const fromChoiceOption = prev.find(
              (prevChoice) => prevChoice.id === fromQuestionId
            );

            return {
              ...prevChoice,
              value: fromChoiceOption?.value ?? prevChoice.value,
              sliderForecast:
                fromChoiceOption?.sliderForecast ?? prevChoice.sliderForecast,
              weights: fromChoiceOption?.weights ?? prevChoice.weights,
              isDirty: true,
            };
          }

          return prevChoice;
        })
      );
    },
    []
  );

  const handleChange = useCallback(
    (optionId: number, forecast: MultiSliderValue[], weights: number[]) => {
      setQuestionOptions((prev) =>
        prev.map((option) => {
          if (option.id === optionId) {
            return {
              ...option,
              value: getTableValue(
                forecast,
                option.weights,
                option.question.open_lower_bound,
                option.question.open_upper_bound
              ),
              isDirty: true,
              sliderForecast: forecast,
              weights,
            };
          }

          return option;
        })
      );
    },
    []
  );

  const handleAddComponent = useCallback((optionId: number) => {
    setQuestionOptions((prev) =>
      prev.map((prevChoice) => {
        if (prevChoice.id === optionId) {
          return {
            ...prevChoice,
            sliderForecast: [
              ...prevChoice.sliderForecast,
              { left: 0.4, center: 0.5, right: 0.6 },
            ],
            weights: [...prevChoice.weights, 1],
            isDirty: true,
          };
        }

        return prevChoice;
      })
    );
  }, []);

  const handleResetForecasts = useCallback(() => {
    setQuestionOptions((prev) =>
      prev.map((prevChoice) => {
        if (prevChoice.id === questionYesId) {
          return {
            ...prevChoice,
            value: getTableValue(
              prevYesForecastValue?.forecast,
              prevYesForecastValue?.weights,
              question_yes.open_lower_bound,
              question_yes.open_upper_bound
            ),
            sliderForecast: getSliderValue(prevYesForecastValue?.forecast),
            weights: getWeightsValue(prevYesForecastValue?.weights),
            isDirty: false,
          };
        } else if (prevChoice.id === questionNoId) {
          return {
            ...prevChoice,
            value: getTableValue(
              prevNoForecastValue?.forecast,
              prevNoForecastValue?.weights,
              question_no.open_lower_bound,
              question_no.open_upper_bound
            ),
            sliderForecast: getSliderValue(prevNoForecastValue?.forecast),
            weights: getWeightsValue(prevNoForecastValue?.weights),
            isDirty: false,
          };
        } else {
          return prevChoice;
        }
      })
    );
  }, [
    prevNoForecastValue?.forecast,
    prevNoForecastValue?.weights,
    prevYesForecastValue?.forecast,
    prevYesForecastValue?.weights,
    questionNoId,
    questionYesId,
    question_no.open_lower_bound,
    question_no.open_upper_bound,
    question_yes.open_lower_bound,
    question_yes.open_upper_bound,
  ]);

  const handlePredictSubmit = async () => {
    setSubmitErrors([]);

    if (!questionsToSubmit.length) {
      return;
    }
    setIsSubmitting(true);
    const response = await createForecasts(
      postId,
      questionsToSubmit.map(({ question, sliderForecast, weights }) => ({
        questionId: question.id,
        forecastData: {
          continuousCdf: getNumericForecastDataset(
            sliderForecast,
            weights,
            question.open_lower_bound!,
            question.open_upper_bound!
          ).cdf,
          probabilityYesPerCategory: null,
          probabilityYes: null,
        },
        sliderValues: {
          forecast: sliderForecast,
          weights,
        },
      }))
    );
    questionsToSubmit.forEach((q) => {
      sendGAConditionalPredictEvent(
        projects,
        q.id === questionYesId ? !!prevYesForecast : !!prevNoForecast,
        hideCP
      );
    });
    setQuestionOptions((prev) =>
      prev.map((prevChoice) => ({ ...prevChoice, isDirty: false }))
    );
    setIsSubmitting(false);

    const errors: ErrorResponse[] = [];

    if (response && "errors" in response && !!response.errors) {
      for (const response_errors of response.errors) {
        errors.push(response_errors);
      }
    }
    if (errors.length) {
      setSubmitErrors(errors);
    }
  };

  const userCdf: number[] | undefined =
    activeOptionData &&
    getNumericForecastDataset(
      activeOptionData.sliderForecast,
      activeOptionData.weights,
      activeOptionData.question.open_lower_bound!,
      activeOptionData.question.open_upper_bound!
    ).cdf;
  const communityCdf: number[] | undefined =
    activeOptionData?.question.aggregations.recency_weighted.latest
      ?.forecast_values;

  return (
    <>
      <ConditionalForecastTable
        postTitle={postTitle}
        condition={condition}
        conditionChild={condition_child}
        childQuestion={question_yes}
        options={questionOptions}
        value={activeTableOption}
        onChange={setActiveTableOption}
        formatForecastValue={(value) => {
          if (activeOptionData && value) {
            return getDisplayValue(
              value,
              activeOptionData.question.type,
              activeOptionData.question.scaling
            );
          } else {
            return "-";
          }
        }}
      />
      {questionOptions.map((option) => (
        <div
          key={option.id}
          className={classNames(
            "mt-3",
            option.id !== activeTableOption && "hidden"
          )}
        >
          <ContinuousSlider
            question={option.question}
            forecast={option.sliderForecast}
            weights={option.weights}
            dataset={getNumericForecastDataset(
              option.sliderForecast,
              option.weights,
              option.question.open_lower_bound!,
              option.question.open_upper_bound!
            )}
            onChange={(forecast, weight) =>
              handleChange(option.id, forecast, weight)
            }
            disabled={!canPredict}
          />
        </div>
      ))}
      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {t(predictionMessage)}
        </div>
      )}
      {canPredict && (
        <div className="my-5 flex flex-wrap items-center justify-center gap-3 px-4">
          {!!user && (
            <>
              <Button
                variant="secondary"
                type="reset"
                onClick={
                  copyForecastButton
                    ? () =>
                        copyForecast(
                          copyForecastButton.fromQuestionId,
                          copyForecastButton.toQuestionId
                        )
                    : undefined
                }
                disabled={!copyForecastButton}
              >
                {copyForecastButton?.label ?? "Copy from Child"}
              </Button>
              {activeTableOption !== null && (
                <Button
                  variant="secondary"
                  type="reset"
                  onClick={() => handleAddComponent(activeTableOption)}
                >
                  {t("addComponentButton")}
                </Button>
              )}
              <Button
                variant="secondary"
                type="reset"
                onClick={handleResetForecasts}
                disabled={!isPickerDirty}
              >
                {t("discardChangesButton")}
              </Button>
            </>
          )}
          <PredictButton
            onSubmit={handlePredictSubmit}
            isDirty={isPickerDirty}
            hasUserForecast={hasUserForecast}
            isPending={isSubmitting}
            isDisabled={!questionsToSubmit.length}
          />
        </div>
      )}
      {submitErrors.map((errResponse, index) => (
        <FormErrorMessage
          className="mb-2 flex justify-center"
          key={`error-${index}`}
          errors={errResponse}
        />
      ))}
      {!!activeOptionData && (
        <NumericForecastTable
          question={activeOptionData.question}
          userBounds={
            userCdf && {
              belowLower: userCdf![0],
              aboveUpper: 1 - userCdf![userCdf!.length - 1],
            }
          }
          userQuartiles={userCdf && computeQuartilesFromCDF(userCdf)}
          communityBounds={
            communityCdf && {
              belowLower: communityCdf![0],
              aboveUpper: 1 - communityCdf![communityCdf!.length - 1],
            }
          }
          communityQuartiles={
            communityCdf && computeQuartilesFromCDF(communityCdf)
          }
          withCommunityQuartiles={!user || !hideCP}
          isDirty={activeOptionData.isDirty}
          hasUserForecast={
            activeTableOption === questionYesId
              ? !!prevYesForecast
              : !!prevNoForecast
          }
        />
      )}
      {activeQuestion && <ScoreDisplay question={activeQuestion} />}
    </>
  );
};

function getUserQuartiles(
  forecast?: MultiSliderValue[],
  weights?: number[],
  openLower?: boolean,
  openUpper?: boolean
): Quartiles | null {
  if (
    !forecast ||
    !weights ||
    typeof openLower === "undefined" ||
    typeof openUpper === "undefined"
  ) {
    return null;
  }

  const dataset = getNumericForecastDataset(
    forecast,
    weights,
    openLower,
    openUpper
  );
  return computeQuartilesFromCDF(dataset.cdf);
}

function getTableValue(
  forecast?: MultiSliderValue[],
  weight?: number[],
  openLower?: boolean,
  openUpper?: boolean
) {
  const quartiles = getUserQuartiles(forecast, weight, openLower, openUpper);
  return quartiles?.median ?? null;
}

function getSliderValue(forecast?: MultiSliderValue[]) {
  return (
    forecast ?? [
      {
        left: 0.4,
        center: 0.5,
        right: 0.6,
      },
    ]
  );
}

function getWeightsValue(weights?: number[]) {
  return weights ?? [1];
}

export default ForecastMakerConditionalContinuous;
