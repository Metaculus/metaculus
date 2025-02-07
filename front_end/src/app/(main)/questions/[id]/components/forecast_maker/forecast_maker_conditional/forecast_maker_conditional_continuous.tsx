"use client";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useCallback, useMemo, useState } from "react";

import {
  createForecasts,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { Post, PostConditional } from "@/types/post";
import {
  DistributionSliderComponent,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getCdfBounds, getDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";
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
  canPredict: boolean;
  predictionMessage: ReactNode;
  projects: Post["projects"];
};

const ForecastMakerConditionalContinuous: FC<Props> = ({
  postId,
  postTitle,
  conditional,
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

  const latestYes = question_yes.my_forecasts?.latest;
  const latestNo = question_no.my_forecasts?.latest;
  const prevYesForecastValue =
    latestYes && !latestYes.end_time
      ? extractPrevNumericForecastValue(latestYes.distribution_input)
      : undefined;
  const prevNoForecastValue =
    latestNo && !latestNo.end_time
      ? extractPrevNumericForecastValue(latestNo.distribution_input)
      : undefined;
  const hasUserForecast =
    !!prevYesForecastValue?.components || !!prevNoForecastValue?.components;

  const [questionOptions, setQuestionOptions] = useState<
    Array<
      ConditionalTableOption & {
        question: QuestionWithNumericForecasts;
        sliderForecast: DistributionSliderComponent[];
      }
    >
  >(() => [
    {
      id: questionYesId,
      name: t("ifYes"),
      value: getTableValue(
        prevYesForecastValue?.components,
        question_yes.open_lower_bound,
        question_yes.open_upper_bound
      ),
      sliderForecast: getSliderValue(prevYesForecastValue?.components),
      isDirty: false,
      question: question_yes,
    },
    {
      id: questionNoId,
      name: t("ifNo"),
      value: getTableValue(
        prevNoForecastValue?.components,
        question_no.open_lower_bound,
        question_no.open_upper_bound
      ),
      sliderForecast: getSliderValue(prevNoForecastValue?.components),
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
  const [submitError, setSubmitError] = useState<ErrorResponse>();
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
    (optionId: number, components: DistributionSliderComponent[]) => {
      setQuestionOptions((prev) =>
        prev.map((option) => {
          if (option.id === optionId) {
            return {
              ...option,
              value: getTableValue(
                components,
                option.question.open_lower_bound,
                option.question.open_upper_bound
              ),
              isDirty: true,
              sliderForecast: components,
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
              { left: 0.4, center: 0.5, right: 0.6, weight: 1 },
            ],
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
              prevYesForecastValue?.components,
              question_yes.open_lower_bound,
              question_yes.open_upper_bound
            ),
            sliderForecast: getSliderValue(prevYesForecastValue?.components),
            isDirty: false,
          };
        } else if (prevChoice.id === questionNoId) {
          return {
            ...prevChoice,
            value: getTableValue(
              prevNoForecastValue?.components,
              question_no.open_lower_bound,
              question_no.open_upper_bound
            ),
            sliderForecast: getSliderValue(prevNoForecastValue?.components),
            isDirty: false,
          };
        } else {
          return prevChoice;
        }
      })
    );
  }, [
    prevNoForecastValue?.components,
    prevYesForecastValue?.components,
    questionNoId,
    questionYesId,
    question_no.open_lower_bound,
    question_no.open_upper_bound,
    question_yes.open_lower_bound,
    question_yes.open_upper_bound,
  ]);

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);

    if (!questionsToSubmit.length) {
      return;
    }
    setIsSubmitting(true);
    const response = await createForecasts(
      postId,
      questionsToSubmit.map(({ question, sliderForecast }) => ({
        questionId: question.id,
        forecastData: {
          continuousCdf: getNumericForecastDataset(
            sliderForecast,
            question.open_lower_bound,
            question.open_upper_bound
          ).cdf,
          probabilityYesPerCategory: null,
          probabilityYes: null,
        },
        distributionInput: {
          type: "slider",
          components: sliderForecast,
        },
      }))
    );
    questionsToSubmit.forEach((q) => {
      sendGAConditionalPredictEvent(
        projects,
        q.id === questionYesId ? !!prevYesForecastValue : !!prevNoForecastValue,
        hideCP
      );
    });
    setQuestionOptions((prev) =>
      prev.map((prevChoice) => ({ ...prevChoice, isDirty: false }))
    );
    setIsSubmitting(false);

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
  };

  const handlePredictWithdraw = async () => {
    setSubmitError(undefined);

    if (!prevYesForecastValue && !prevNoForecastValue) return;

    const response = await withdrawForecasts(postId, [
      ...(prevYesForecastValue ? [{ question: questionYesId }] : []),
      ...(prevNoForecastValue ? [{ question: questionNoId }] : []),
    ]);
    setQuestionOptions((prev) =>
      prev.map((prevChoice) => ({ ...prevChoice, isDirty: false }))
    );

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
  };
  const [withdraw, withdrawalIsPending] = useServerAction(
    handlePredictWithdraw
  );

  const previousForecast = activeOptionData?.question.my_forecasts?.latest;
  const [overlayPreviousForecast, setOverlayPreviousForecast] =
    useState<boolean>(
      !!previousForecast && !previousForecast?.distribution_input
    );

  const userCdf: number[] | undefined =
    activeOptionData &&
    getNumericForecastDataset(
      activeOptionData.sliderForecast,
      activeOptionData.question.open_lower_bound,
      activeOptionData.question.open_upper_bound
    ).cdf;
  const userPreviousCdf: number[] | undefined =
    overlayPreviousForecast && previousForecast
      ? previousForecast.forecast_values
      : undefined;
  const aggregateLatest =
    activeOptionData?.question.aggregations.recency_weighted.latest;
  const communityCdf: number[] | undefined =
    aggregateLatest && !aggregateLatest.end_time
      ? aggregateLatest.forecast_values
      : undefined;

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
            return getDisplayValue({
              value,
              questionType: activeOptionData.question.type,
              scaling: activeOptionData.question.scaling,
            });
          } else {
            return "-";
          }
        }}
      />
      {questionOptions.map((option) => (
        <div
          key={option.id}
          className={cn("mt-3", option.id !== activeTableOption && "hidden")}
        >
          <ContinuousSlider
            question={option.question}
            components={option.sliderForecast}
            overlayPreviousForecast={overlayPreviousForecast}
            setOverlayPreviousForecast={setOverlayPreviousForecast}
            dataset={getNumericForecastDataset(
              option.sliderForecast,
              option.question.open_lower_bound,
              option.question.open_upper_bound
            )}
            onChange={(components) => handleChange(option.id, components)}
            disabled={!canPredict}
          />
        </div>
      ))}
      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {predictionMessage}
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
              {(!!prevYesForecastValue || !!prevNoForecastValue) && (
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={withdrawalIsPending}
                  onClick={withdraw}
                >
                  {t("withdraw")}
                </Button>
              )}
            </>
          )}
          <PredictButton
            onSubmit={handlePredictSubmit}
            isDirty={isPickerDirty}
            hasUserForecast={hasUserForecast}
            isPending={isSubmitting}
            isDisabled={!questionsToSubmit.length}
            predictLabel={previousForecast ? undefined : t("predict")}
          />
        </div>
      )}
      <FormError
        errors={submitError}
        className="flex items-center justify-center"
        detached
      />
      {!!activeOptionData && (
        <NumericForecastTable
          question={activeOptionData.question}
          userBounds={getCdfBounds(userCdf)}
          userQuartiles={userCdf && computeQuartilesFromCDF(userCdf)}
          communityBounds={getCdfBounds(communityCdf)}
          userPreviousBounds={getCdfBounds(userPreviousCdf)}
          userPreviousQuartiles={
            userPreviousCdf
              ? computeQuartilesFromCDF(userPreviousCdf)
              : undefined
          }
          communityQuartiles={
            communityCdf && computeQuartilesFromCDF(communityCdf)
          }
          withCommunityQuartiles={!user || !hideCP}
          isDirty={activeOptionData.isDirty}
          hasUserForecast={
            activeTableOption === questionYesId
              ? !!prevYesForecastValue
              : !!prevNoForecastValue
          }
        />
      )}
      {activeQuestion && <ScoreDisplay question={activeQuestion} />}
    </>
  );
};

function getUserQuartiles(
  components?: DistributionSliderComponent[],
  openLower?: boolean,
  openUpper?: boolean
): Quartiles | null {
  if (
    !components ||
    typeof openLower === "undefined" ||
    typeof openUpper === "undefined"
  ) {
    return null;
  }

  const dataset = getNumericForecastDataset(components, openLower, openUpper);
  return computeQuartilesFromCDF(dataset.cdf);
}

function getTableValue(
  components?: DistributionSliderComponent[],
  openLower?: boolean,
  openUpper?: boolean
) {
  const quartiles = getUserQuartiles(components, openLower, openUpper);
  return quartiles?.median ?? null;
}

function getSliderValue(components?: DistributionSliderComponent[]) {
  return (
    components ?? [
      {
        left: 0.4,
        center: 0.5,
        right: 0.6,
        weight: 1,
      },
    ]
  );
}

export default ForecastMakerConditionalContinuous;
