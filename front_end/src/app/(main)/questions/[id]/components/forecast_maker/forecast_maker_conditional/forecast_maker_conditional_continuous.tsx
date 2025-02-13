"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useCallback, useMemo, useState } from "react";

import {
  createForecasts,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import { Post, PostConditional, QuestionStatus } from "@/types/post";
import {
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
  Quantile,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getCdfBounds, getTableDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";
import {
  clearQuantileComponents,
  extractPrevNumericForecastValue,
  getInitialQuantileDistributionComponents,
  getInitialSliderDistributionComponents,
  getNumericForecastDataset,
  getQuantileNumericForecastDataset,
  getQuantilesDistributionFromSlider,
  getSliderDistributionFromQuantiles,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

import { sendGAConditionalPredictEvent } from "./ga_events";
import { useHideCP } from "../../cp_provider";
import ConditionalForecastTable, {
  ConditionalTableOption,
} from "../conditional_forecast_table";
import ContinuousSlider from "../continuous_slider";
import {
  validateAllQuantileInputs,
  validateUserQuantileData,
} from "../helpers";
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
        quantileForecast: DistributionQuantileComponent;
        quantileValue: number | null;
        forecastInputMode: ForecastInputType;
      }
    >
  >(() => [
    {
      id: questionYesId,
      name: t("ifYes"),
      ...(() => {
        const quantileForecast = getInitialQuantileDistributionComponents(
          latestYes,
          prevYesForecastValue,
          question_yes
        );
        const sliderForecast = getInitialSliderDistributionComponents(
          latestYes,
          prevYesForecastValue,
          question_yes
        );
        const forecastInputMode =
          prevYesForecastValue?.type === ForecastInputType.Quantile
            ? ForecastInputType.Quantile
            : ForecastInputType.Slider;
        return {
          forecastInputMode,
          sliderForecast,
          quantileForecast,
          value: prevYesForecastValue
            ? getTableValue(
                sliderForecast,
                question_yes.open_lower_bound,
                question_yes.open_upper_bound,
                ForecastInputType.Slider
              )
            : null,
          quantileValue: prevYesForecastValue
            ? getTableValue(
                quantileForecast,
                question_yes.open_lower_bound,
                question_yes.open_upper_bound,
                ForecastInputType.Quantile
              )
            : null,
        };
      })(),
      isDirty: false,
      question: question_yes,
    },
    {
      id: questionNoId,
      name: t("ifNo"),
      ...(() => {
        const quantileForecast = getInitialQuantileDistributionComponents(
          latestNo,
          prevNoForecastValue,
          question_no
        );
        const sliderForecast = getInitialSliderDistributionComponents(
          latestNo,
          prevNoForecastValue,
          question_no
        );
        const forecastInputMode =
          prevNoForecastValue?.type === ForecastInputType.Quantile
            ? ForecastInputType.Quantile
            : ForecastInputType.Slider;

        return {
          forecastInputMode,
          sliderForecast,
          quantileForecast,
          value: prevNoForecastValue
            ? getTableValue(
                sliderForecast,
                question_no.open_lower_bound,
                question_no.open_upper_bound,
                ForecastInputType.Slider
              )
            : null,
          quantileValue: prevNoForecastValue
            ? getTableValue(
                quantileForecast,
                question_no.open_lower_bound,
                question_no.open_upper_bound,
                ForecastInputType.Quantile
              )
            : null,
        };
      })(),
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
    () =>
      questionOptions.filter(
        (option) =>
          (option.forecastInputMode === ForecastInputType.Slider &&
            option.value !== null &&
            option.question.status === QuestionStatus.OPEN) ||
          (option.forecastInputMode === ForecastInputType.Quantile &&
            option.quantileValue !== null &&
            option.question.status === QuestionStatus.OPEN)
      ),
    [questionOptions]
  );

  const copyForecastButton = useMemo(() => {
    if (!activeTableOption) return null;

    const inactiveOption = questionOptions.find(
      (option) => option.id !== activeTableOption
    );

    if (
      !inactiveOption ||
      (inactiveOption.value === null && inactiveOption.quantileValue === null)
    ) {
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
              quantileValue:
                fromChoiceOption?.quantileValue ?? prevChoice.quantileValue,
              quantileForecast:
                fromChoiceOption?.quantileForecast.map((q) => ({
                  ...q,
                  isDirty: true,
                })) ?? prevChoice.quantileForecast,
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
    (
      optionId: number,
      components: DistributionSliderComponent[] | DistributionQuantileComponent,
      forecastInputMode: ForecastInputType
    ) => {
      setQuestionOptions((prev) =>
        prev.map((option) => {
          if (option.id === optionId) {
            return {
              ...option,
              ...(forecastInputMode === ForecastInputType.Quantile
                ? {
                    quantileValue: getTableValue(
                      components,
                      option.question.open_lower_bound,
                      option.question.open_upper_bound,
                      forecastInputMode
                    ),
                  }
                : {
                    value: getTableValue(
                      components,
                      option.question.open_lower_bound,
                      option.question.open_upper_bound,
                      forecastInputMode
                    ),
                  }),
              isDirty: true,
              ...(forecastInputMode === ForecastInputType.Slider
                ? {
                    sliderForecast: components as DistributionSliderComponent[],
                  }
                : {
                    quantileForecast:
                      components as DistributionQuantileComponent,
                  }),
            };
          }

          return option;
        })
      );
    },
    []
  );

  const handleForecastInputModeChange = useCallback(
    (optionId: number, mode: ForecastInputType) => {
      setQuestionOptions((prev) =>
        prev.map((prevChoice) => {
          if (prevChoice.id === optionId) {
            return {
              ...prevChoice,
              forecastInputMode: mode,
            };
          }

          return prevChoice;
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
              prevYesForecastValue?.components as DistributionSliderComponent[],
              question_yes.open_lower_bound,
              question_yes.open_upper_bound
            ),
            sliderForecast: getInitialSliderDistributionComponents(
              latestYes,
              prevYesForecastValue,
              question_yes
            ),
            quantileForecast: getInitialQuantileDistributionComponents(
              latestYes,
              prevYesForecastValue,
              question_yes
            ),
            isDirty: false,
            forecastInputMode:
              prevYesForecastValue?.type === ForecastInputType.Quantile
                ? ForecastInputType.Quantile
                : ForecastInputType.Slider,
          };
        } else if (prevChoice.id === questionNoId) {
          return {
            ...prevChoice,
            value: getTableValue(
              prevNoForecastValue?.components as DistributionSliderComponent[],
              question_no.open_lower_bound,
              question_no.open_upper_bound
            ),
            sliderForecast: getInitialSliderDistributionComponents(
              latestNo,
              prevNoForecastValue,
              question_no
            ),
            quantileForecast: getInitialQuantileDistributionComponents(
              latestNo,
              prevNoForecastValue,
              question_no
            ),
            isDirty: false,
            forecastInputMode:
              prevNoForecastValue?.type === ForecastInputType.Quantile
                ? ForecastInputType.Quantile
                : ForecastInputType.Slider,
          };
        } else {
          return prevChoice;
        }
      })
    );
  }, [
    questionNoId,
    questionYesId,
    question_no,
    question_yes,
    latestNo,
    latestYes,
    prevNoForecastValue,
    prevYesForecastValue,
  ]);

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);
    if (!questionsToSubmit.length) {
      return;
    }
    setIsSubmitting(true);
    for (const q of questionsToSubmit) {
      if (q.forecastInputMode === ForecastInputType.Quantile) {
        const validationErrors = validateUserQuantileData({
          question: q.question,
          components: q.quantileForecast,
          cdf: getQuantileNumericForecastDataset(q.quantileForecast, q.question)
            .cdf,
          t,
        });
        if (validationErrors.length > 0) {
          setSubmitError(
            !isNil(validationErrors[0])
              ? new Error(validationErrors[0])
              : new Error(t("unexpectedError"))
          );
          setIsSubmitting(false);
          return;
        }
      }
    }

    const response = await createForecasts(
      postId,
      questionsToSubmit.map(
        ({
          question,
          sliderForecast,
          quantileForecast,
          forecastInputMode,
        }) => ({
          questionId: question.id,
          forecastData: {
            continuousCdf:
              forecastInputMode === ForecastInputType.Quantile
                ? getQuantileNumericForecastDataset(quantileForecast, question)
                    .cdf
                : getNumericForecastDataset(
                    sliderForecast,
                    question.open_lower_bound,
                    question.open_upper_bound
                  ).cdf,
            probabilityYesPerCategory: null,
            probabilityYes: null,
          },
          distributionInput: {
            type: forecastInputMode,
            components:
              forecastInputMode === ForecastInputType.Slider
                ? sliderForecast
                : clearQuantileComponents(quantileForecast),
          } as DistributionSlider | DistributionQuantile,
        })
      )
    );
    questionsToSubmit.forEach((q) => {
      sendGAConditionalPredictEvent(
        projects,
        q.id === questionYesId ? !!prevYesForecastValue : !!prevNoForecastValue,
        hideCP
      );
    });
    // update inactive forecast tab with new forecast data
    setQuestionOptions((prev) =>
      prev.map((prevChoice) => {
        const questionToSubmit = questionsToSubmit.find(
          (q) => q.id === prevChoice.id
        );
        if (!questionToSubmit) {
          return prevChoice;
        }

        const quantileForecast =
          prevChoice.forecastInputMode === ForecastInputType.Quantile
            ? prevChoice.quantileForecast.map((q) => ({
                ...q,
                isDirty: false,
              }))
            : getQuantilesDistributionFromSlider(
                prevChoice.sliderForecast,
                prevChoice.question
              );
        const sliderForecast =
          prevChoice.forecastInputMode === ForecastInputType.Slider
            ? prevChoice.sliderForecast
            : getSliderDistributionFromQuantiles(
                prevChoice.quantileForecast,
                prevChoice.question
              );

        return {
          ...prevChoice,
          quantileForecast,
          sliderForecast,
          ...(prevChoice.forecastInputMode === ForecastInputType.Quantile
            ? {
                value: getTableValue(
                  sliderForecast,
                  prevChoice.question.open_lower_bound,
                  prevChoice.question.open_upper_bound,
                  ForecastInputType.Slider
                ),
              }
            : {
                quantileValue: getTableValue(
                  quantileForecast,
                  prevChoice.question.open_lower_bound,
                  prevChoice.question.open_upper_bound,
                  ForecastInputType.Quantile
                ),
              }),
          isDirty: false,
        };
      })
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
        formatForecastValue={(value, forecastInputMode) => {
          if (activeOptionData && value) {
            return getTableDisplayValue({
              value,
              questionType: activeOptionData.question.type,
              scaling: activeOptionData.question.scaling,
              forecastInputMode: forecastInputMode,
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
            dataset={
              option.forecastInputMode === ForecastInputType.Slider
                ? getNumericForecastDataset(
                    option.sliderForecast,
                    option.question.open_lower_bound,
                    option.question.open_upper_bound
                  )
                : validateAllQuantileInputs({
                      question: option.question,
                      components: option.quantileForecast,
                      t,
                    }).length === 0
                  ? getQuantileNumericForecastDataset(
                      option.quantileForecast,
                      option.question
                    )
                  : {
                      cdf: [],
                      pmf: [],
                    }
            }
            onChange={(components) =>
              handleChange(option.id, components, option.forecastInputMode)
            }
            disabled={!canPredict}
            showInputModeSwitcher
            forecastInputMode={option.forecastInputMode}
            setForecastInputMode={(mode) =>
              handleForecastInputModeChange(option.id, mode)
            }
          />
        </div>
      ))}
      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {predictionMessage}
        </div>
      )}
      {canPredict &&
        activeOptionData?.forecastInputMode === ForecastInputType.Slider && (
          <>
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
            <FormError
              errors={submitError}
              className="flex items-center justify-center"
              detached
            />
          </>
        )}
      {!!activeOptionData && (
        <>
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
            withUserQuartiles={
              !!previousForecast ||
              activeOptionData.question.status === QuestionStatus.OPEN
            }
            quantileComponents={activeOptionData.quantileForecast}
            onQuantileChange={(quantileComponents) =>
              activeTableOption &&
              handleChange(
                activeTableOption,
                quantileComponents,
                ForecastInputType.Quantile
              )
            }
            isDirty={activeOptionData.isDirty}
            hasUserForecast={
              activeTableOption === questionYesId
                ? !!prevYesForecastValue
                : !!prevNoForecastValue
            }
            forecastInputMode={activeOptionData.forecastInputMode}
          />

          {canPredict &&
            activeOptionData.forecastInputMode === ForecastInputType.Quantile &&
            activeQuestion && (
              <>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-3 px-4">
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

                  <Button
                    variant="secondary"
                    type="submit"
                    disabled={
                      !activeOptionData?.isDirty &&
                      !(activeOptionData?.quantileForecast ?? []).some(
                        (value) => value?.isDirty === true
                      )
                    }
                    onClick={handleResetForecasts}
                  >
                    {t("discardChangesButton")}
                  </Button>

                  <Button
                    variant="secondary"
                    type="submit"
                    disabled={withdrawalIsPending}
                    onClick={withdraw}
                  >
                    {t("withdraw")}
                  </Button>

                  <PredictButton
                    onSubmit={handlePredictSubmit}
                    isDirty={activeOptionData.quantileForecast.some(
                      (q) => q.isDirty
                    )}
                    hasUserForecast={hasUserForecast}
                    isPending={isSubmitting}
                    predictLabel={previousForecast ? undefined : t("predict")}
                    isDisabled={
                      validateAllQuantileInputs({
                        question: activeQuestion,
                        components: activeOptionData.quantileForecast,
                        t,
                      }).length !== 0
                    }
                  />
                </div>
                <FormError
                  errors={submitError}
                  className="mt-2 flex items-center justify-center"
                  detached
                />
                <div className="h-[32px]">
                  {(isSubmitting || withdrawalIsPending) && (
                    <LoadingIndicator />
                  )}
                </div>
              </>
            )}
        </>
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
  components?: DistributionSliderComponent[] | DistributionQuantileComponent,
  openLower?: boolean,
  openUpper?: boolean,
  forecastInputMode?: ForecastInputType
) {
  if (forecastInputMode === ForecastInputType.Quantile) {
    return (
      (components as DistributionQuantileComponent)?.find(
        (component) => component.quantile === Quantile.q2
      )?.value ?? null
    );
  }

  const quartiles = getUserQuartiles(
    components as DistributionSliderComponent[],
    openLower,
    openUpper
  );
  return quartiles?.median ?? null;
}

export default ForecastMakerConditionalContinuous;
