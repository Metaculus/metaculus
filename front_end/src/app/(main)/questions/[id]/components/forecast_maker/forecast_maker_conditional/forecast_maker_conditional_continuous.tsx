"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createForecasts,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ContinuousForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import { Post, PostConditional, QuestionStatus } from "@/types/post";
import {
  DefaultInboundOutcomeCount,
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
  Quantile,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getTableDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";
import {
  clearQuantileComponents,
  extractPrevNumericForecastValue,
  getInitialQuantileDistributionComponents,
  getInitialSliderDistributionComponents,
  getQuantileNumericForecastDataset,
  getQuantilesDistributionFromSlider,
  getSliderDistributionFromQuantiles,
  getSliderNumericForecastDataset,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

import { sendGAConditionalPredictEvent } from "./ga_events";
import { useHideCP } from "../../cp_provider";
import ConditionalForecastTable, {
  ConditionalTableOption,
} from "../conditional_forecast_table";
import ContinuousInput from "../continuous_input";
import {
  validateAllQuantileInputs,
  validateUserQuantileData,
} from "../helpers";
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
        forecastInputMode: ContinuousForecastInputType;
      }
    >
  >(() => getQuestionOptions(conditional, t));

  // update options on revalidate path
  useEffect(() => {
    setQuestionOptions(() => getQuestionOptions(conditional, t));
  }, [conditional, t]);

  const [activeTableOption, setActiveTableOption] = useState(
    questionOptions.at(0)?.question.resolution === "annulled"
      ? questionOptions.at(1)?.id ?? null
      : questionOptions.at(0)?.id ?? null
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
          (option.forecastInputMode === ContinuousForecastInputType.Slider &&
            option.value !== null &&
            option.question.status === QuestionStatus.OPEN) ||
          (option.forecastInputMode === ContinuousForecastInputType.Quantile &&
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

    if (inactiveOption?.value ?? inactiveOption?.quantileValue) {
      // Copy forecast from inactive option if there is a prediction
      return {
        label: t("copyFromBranch", {
          branch: inactiveOption.name.toUpperCase(),
        }),
        fromQuestionId: inactiveOption.id,
        toQuestionId: activeTableOption,
      };
    }

    if (!!condition_child.my_forecasts?.latest) {
      // Copy forecast from child question if there is a prediction
      return {
        label: "Copy from Child",
        fromQuestionId: condition_child.id,
        toQuestionId: activeTableOption,
      };
    }
    return null;
  }, [activeTableOption, questionOptions, condition_child, t]);

  const copyForecast = useCallback(
    (fromQuestionId: number, toQuestionId: number) => {
      setQuestionOptions((prev) =>
        prev.map((prevChoice) => {
          if (prevChoice.id === toQuestionId) {
            const fromChoice = prev.find(
              (prevChoice) => prevChoice.id === fromQuestionId
            );
            if (fromChoice?.value) {
              return {
                ...prevChoice,
                value: fromChoice.value,
                quantileValue: fromChoice.quantileValue,
                quantileForecast: fromChoice.quantileForecast.map((q) => ({
                  ...q,
                  isDirty: true,
                })),
                sliderForecast: fromChoice.sliderForecast,
                forecastInputMode: fromChoice.forecastInputMode,
                isDirty: true,
              };
            }

            const latest = condition_child.my_forecasts?.latest;
            if (latest?.distribution_input?.components) {
              const updatedForecast = {
                ...prevChoice,
                value: latest.centers?.at(0) ?? null,
                quantileValue: null,
                quantileForecast:
                  latest.distribution_input.type === "quantile"
                    ? latest.distribution_input.components
                    : getQuantilesDistributionFromSlider(
                        latest.distribution_input.components,
                        condition_child as QuestionWithNumericForecasts
                      ),
                sliderForecast:
                  latest.distribution_input.type === "slider"
                    ? latest.distribution_input.components
                    : getSliderDistributionFromQuantiles(
                        latest.distribution_input.components,
                        condition_child
                      ),
                isDirty: true,
                forecastInputMode:
                  latest.distribution_input.type === "slider"
                    ? ContinuousForecastInputType.Slider
                    : ContinuousForecastInputType.Quantile,
              };
              return updatedForecast;
            }

            return prevChoice;
          }

          return prevChoice;
        })
      );
    },
    [condition_child]
  );

  const handleChange = useCallback(
    (
      optionId: number,
      components: DistributionSliderComponent[] | DistributionQuantileComponent,
      forecastInputMode: ContinuousForecastInputType
    ) => {
      setQuestionOptions((prev) =>
        prev.map((option) => {
          if (option.id === optionId) {
            return {
              ...option,
              ...(forecastInputMode === ContinuousForecastInputType.Quantile
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
              ...(forecastInputMode === ContinuousForecastInputType.Slider
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
    (optionId: number, mode: ContinuousForecastInputType) => {
      setQuestionOptions((prev) =>
        prev.map((prevChoice) => {
          if (prevChoice.id === optionId) {
            return {
              ...prevChoice,
              forecastInputMode: mode,
              isDirty: prevChoice.isDirty,
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
          const quantileForecast = getInitialQuantileDistributionComponents(
            latestYes,
            prevYesForecastValue,
            question_yes
          );
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
            quantileValue: getTableValue(
              quantileForecast,
              question_yes.open_lower_bound,
              question_yes.open_upper_bound,
              ContinuousForecastInputType.Quantile
            ),
            quantileForecast,
            isDirty: false,
            forecastInputMode:
              prevYesForecastValue?.type ?? prevChoice.forecastInputMode,
          };
        } else if (prevChoice.id === questionNoId) {
          const quantileForecast = getInitialQuantileDistributionComponents(
            latestNo,
            prevNoForecastValue,
            question_no
          );
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
            quantileValue: getTableValue(
              quantileForecast,
              question_no.open_lower_bound,
              question_no.open_upper_bound,
              ContinuousForecastInputType.Quantile
            ),
            quantileForecast,
            isDirty: false,
            forecastInputMode:
              prevNoForecastValue?.type ?? prevChoice.forecastInputMode,
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
      if (q.forecastInputMode === ContinuousForecastInputType.Quantile) {
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
              forecastInputMode === ContinuousForecastInputType.Quantile
                ? getQuantileNumericForecastDataset(quantileForecast, question)
                    .cdf
                : getSliderNumericForecastDataset(
                    sliderForecast,
                    question.open_lower_bound,
                    question.open_upper_bound,
                    question.inbound_outcome_count ?? DefaultInboundOutcomeCount
                  ).cdf,
            probabilityYesPerCategory: null,
            probabilityYes: null,
          },
          distributionInput: {
            type: forecastInputMode,
            components:
              forecastInputMode === ContinuousForecastInputType.Slider
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
          prevChoice.forecastInputMode === ContinuousForecastInputType.Quantile
            ? prevChoice.quantileForecast.map((q) => ({
                ...q,
                isDirty: false,
              }))
            : getQuantilesDistributionFromSlider(
                prevChoice.sliderForecast,
                prevChoice.question
              );
        const sliderForecast =
          prevChoice.forecastInputMode === ContinuousForecastInputType.Slider
            ? prevChoice.sliderForecast
            : getSliderDistributionFromQuantiles(
                prevChoice.quantileForecast,
                prevChoice.question
              );

        return {
          ...prevChoice,
          quantileForecast,
          sliderForecast,
          ...(prevChoice.forecastInputMode ===
          ContinuousForecastInputType.Quantile
            ? {
                value: getTableValue(
                  sliderForecast,
                  prevChoice.question.open_lower_bound,
                  prevChoice.question.open_upper_bound,
                  ContinuousForecastInputType.Slider
                ),
              }
            : {
                quantileValue: getTableValue(
                  quantileForecast,
                  prevChoice.question.open_lower_bound,
                  prevChoice.question.open_upper_bound,
                  ContinuousForecastInputType.Quantile
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
  const datasets = useMemo(() => {
    setSubmitError(undefined);
    return questionOptions.map((option) => {
      if (option.forecastInputMode === ContinuousForecastInputType.Slider) {
        return {
          id: option.id,
          dataset: getSliderNumericForecastDataset(
            option.sliderForecast,
            option.question.open_lower_bound,
            option.question.open_upper_bound,
            option.question.inbound_outcome_count ?? DefaultInboundOutcomeCount
          ),
        };
      } else if (
        validateAllQuantileInputs({
          question: option.question,
          components: option.quantileForecast,
          t,
        }).length === 0
      ) {
        const quantileDataset = {
          id: option.id,
          dataset: getQuantileNumericForecastDataset(
            option.quantileForecast,
            option.question
          ),
        };
        if (quantileDataset.dataset.error) {
          setSubmitError(
            new Error(t(quantileDataset.dataset.error) ?? t("unexpectedError"))
          );
        }
        return quantileDataset;
      }
      return { id: option.id, dataset: { cdf: [], pmf: [] } };
    });
  }, [questionOptions, t]);

  const userCdf: number[] | undefined =
    activeOptionData &&
    getSliderNumericForecastDataset(
      activeOptionData.sliderForecast,
      activeOptionData.question.open_lower_bound,
      activeOptionData.question.open_upper_bound,
      activeOptionData.question.inbound_outcome_count ??
        DefaultInboundOutcomeCount
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

  let SubmitControls: ReactNode = null;
  if (canPredict) {
    SubmitControls = (
      <>
        <div
          className={cn(
            "flex flex-wrap items-center justify-center gap-3 px-4",
            {
              "my-5":
                activeOptionData?.forecastInputMode ===
                ContinuousForecastInputType.Slider,
              "mt-5":
                activeOptionData?.forecastInputMode ===
                ContinuousForecastInputType.Quantile,
            }
          )}
        >
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
              {activeOptionData?.forecastInputMode ===
                ContinuousForecastInputType.Slider &&
                activeTableOption !== null && (
                  <Button
                    variant="secondary"
                    type="reset"
                    onClick={() => handleAddComponent(activeTableOption)}
                  >
                    {t("addComponentButton")}
                  </Button>
                )}
              {(activeOptionData?.forecastInputMode ===
                ContinuousForecastInputType.Slider &&
                isPickerDirty) ||
              (activeOptionData?.forecastInputMode ===
                ContinuousForecastInputType.Quantile &&
                (activeOptionData?.isDirty ||
                  (activeOptionData?.quantileForecast ?? []).some(
                    (value) => value?.isDirty === true
                  ))) ? (
                <Button
                  variant="secondary"
                  type="reset"
                  onClick={handleResetForecasts}
                >
                  {t("discardChangesButton")}
                </Button>
              ) : !!prevYesForecastValue || !!prevNoForecastValue ? (
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={withdrawalIsPending}
                  onClick={withdraw}
                >
                  {t("withdraw")}
                </Button>
              ) : null}
            </>
          )}

          {activeOptionData?.forecastInputMode ===
            ContinuousForecastInputType.Slider && (
            <PredictButton
              onSubmit={handlePredictSubmit}
              isDirty={isPickerDirty}
              hasUserForecast={hasUserForecast}
              isPending={isSubmitting}
              isDisabled={!questionsToSubmit.length}
              predictLabel={previousForecast ? undefined : t("predict")}
            />
          )}

          {activeOptionData?.forecastInputMode ===
            ContinuousForecastInputType.Quantile &&
            activeQuestion && (
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
                  }).length !== 0 || !isNil(submitError)
                }
              />
            )}
        </div>

        <FormError
          errors={submitError}
          className={cn("flex items-center justify-center", {
            "mt-2":
              activeOptionData?.forecastInputMode ===
              ContinuousForecastInputType.Quantile,
          })}
          detached
        />
        <div className="h-[32px]">
          {(isSubmitting || withdrawalIsPending) && <LoadingIndicator />}
        </div>
      </>
    );
  }

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
          if (activeOptionData && !isNil(value)) {
            return getTableDisplayValue({
              value,
              questionType: activeOptionData.question.type,
              scaling: activeOptionData.question.scaling,
              forecastInputMode: forecastInputMode,
              actual_resolve_time:
                activeOptionData.question.actual_resolve_time ?? null,
            });
          } else {
            return "-";
          }
        }}
      />
      {questionOptions.map((option) => {
        const dataset = datasets.find((d) => d.id === option.id)?.dataset;
        if (!dataset) return null;
        return (
          <div
            key={option.id}
            className={cn("mt-3", option.id !== activeTableOption && "hidden")}
          >
            <ContinuousInput
              question={option.question}
              dataset={dataset}
              userCdf={userCdf}
              userPreviousCdf={userPreviousCdf}
              communityCdf={communityCdf}
              sliderComponents={option.sliderForecast}
              onSliderChange={(components) =>
                handleChange(
                  option.id,
                  components,
                  ContinuousForecastInputType.Slider
                )
              }
              quantileComponent={option.quantileForecast}
              onQuantileChange={(quantileComponents) =>
                handleChange(
                  option.id,
                  quantileComponents,
                  ContinuousForecastInputType.Quantile
                )
              }
              overlayPreviousForecast={overlayPreviousForecast}
              onOverlayPreviousForecastChange={setOverlayPreviousForecast}
              forecastInputMode={option.forecastInputMode}
              onForecastInputModeChange={(mode) =>
                handleForecastInputModeChange(option.id, mode)
              }
              hasUserForecast={hasUserForecast}
              isDirty={option.isDirty}
              submitControls={SubmitControls}
              disabled={!canPredict}
              predictionMessage={predictionMessage}
            />
          </div>
        );
      })}
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

  const dataset = getSliderNumericForecastDataset(
    components,
    openLower,
    openUpper,
    DefaultInboundOutcomeCount
  );
  return computeQuartilesFromCDF(dataset.cdf);
}

function getTableValue(
  components?: DistributionSliderComponent[] | DistributionQuantileComponent,
  openLower?: boolean,
  openUpper?: boolean,
  forecastInputMode?: ContinuousForecastInputType
) {
  if (forecastInputMode === ContinuousForecastInputType.Quantile) {
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

function getQuestionOptions(
  conditional: PostConditional<QuestionWithNumericForecasts>,
  t: ReturnType<typeof useTranslations>
) {
  const { question_yes, question_no } = conditional;
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

  return [
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
          prevYesForecastValue?.type === ContinuousForecastInputType.Quantile
            ? ContinuousForecastInputType.Quantile
            : ContinuousForecastInputType.Slider;
        return {
          forecastInputMode,
          sliderForecast,
          quantileForecast,
          value: prevYesForecastValue
            ? getTableValue(
                sliderForecast,
                question_yes.open_lower_bound,
                question_yes.open_upper_bound,
                ContinuousForecastInputType.Slider
              )
            : null,
          quantileValue: prevYesForecastValue
            ? getTableValue(
                quantileForecast,
                question_yes.open_lower_bound,
                question_yes.open_upper_bound,
                ContinuousForecastInputType.Quantile
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
          prevNoForecastValue?.type === ContinuousForecastInputType.Quantile
            ? ContinuousForecastInputType.Quantile
            : ContinuousForecastInputType.Slider;

        return {
          forecastInputMode,
          sliderForecast,
          quantileForecast,
          value: prevNoForecastValue
            ? getTableValue(
                sliderForecast,
                question_no.open_lower_bound,
                question_no.open_upper_bound,
                ContinuousForecastInputType.Slider
              )
            : null,
          quantileValue: prevNoForecastValue
            ? getTableValue(
                quantileForecast,
                question_no.open_lower_bound,
                question_no.open_upper_bound,
                ContinuousForecastInputType.Quantile
              )
            : null,
        };
      })(),
      isDirty: false,
      question: question_no,
    },
  ];
}

export default ForecastMakerConditionalContinuous;
