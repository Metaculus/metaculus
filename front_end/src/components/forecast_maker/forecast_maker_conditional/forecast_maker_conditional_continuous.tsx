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
import ForecastMakerConditionalResolutionMessage from "@/components/forecast_maker/forecast_maker_conditional/forecast_maker_conditional_resolution_message";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ContinuousForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import { Post, PostConditional, QuestionStatus } from "@/types/post";
import {
  DistributionQuantile,
  DistributionQuantileComponent,
  DistributionSlider,
  DistributionSliderComponent,
  Quantile,
  Quartiles,
  Question,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { sendConditionalPredictEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import {
  getQuantileNumericForecastDataset,
  getSliderNumericForecastDataset,
} from "@/utils/forecasts/dataset";
import {
  clearQuantileComponents,
  isForecastActive,
} from "@/utils/forecasts/helpers";
import {
  extractPrevNumericForecastValue,
  getInitialQuantileDistributionComponents,
  getInitialSliderDistributionComponents,
} from "@/utils/forecasts/initial_values";
import {
  getQuantilesDistributionFromSlider,
  getSliderDistributionFromQuantiles,
} from "@/utils/forecasts/switch_forecast_type";
import { getTableDisplayValue } from "@/utils/formatters/prediction";
import { computeQuartilesFromCDF } from "@/utils/math";

import ConditionalForecastTable, {
  ConditionalTableOption,
} from "../conditional_forecast_table";
import ContinuousInput from "../continuous_input";
import {
  buildDefaultForecastExpiration,
  ForecastExpirationModal,
  forecastExpirationToDate,
  ForecastExpirationValue,
  useExpirationModalState,
} from "../forecast_expiration";
import {
  validateAllQuantileInputs,
  validateUserQuantileData,
} from "../helpers";
import PredictButton from "../predict_button";
import WithdrawButton from "../withdraw/withdraw_button";

type Props = {
  postId: number;
  postTitle: string;
  conditional: PostConditional<QuestionWithNumericForecasts>;
  canPredict: boolean;
  predictionMessage: ReactNode;
  projects: Post["projects"];
  onPredictionSubmit?: () => void;
};

const ForecastMakerConditionalContinuous: FC<Props> = ({
  postId,
  postTitle,
  conditional,
  canPredict,
  predictionMessage,
  projects,
  onPredictionSubmit,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hideCP } = useHideCP();

  const { condition, condition_child, question_yes, question_no } = conditional;
  const questionYesId = question_yes.id;
  const questionNoId = question_no.id;
  const latestYes = question_yes.my_forecasts?.latest;
  const latestNo = question_no.my_forecasts?.latest;

  const hasLatestActiveYes = latestYes && isForecastActive(latestYes);
  const hasLatestActiveNo = latestNo && isForecastActive(latestNo);

  const prevYesForecastValue = latestYes
    ? extractPrevNumericForecastValue(latestYes.distribution_input)
    : undefined;
  const prevNoForecastValue = latestNo
    ? extractPrevNumericForecastValue(latestNo.distribution_input)
    : undefined;
  const hasUserForecast =
    !!prevYesForecastValue?.components || !!prevNoForecastValue?.components;
  const hasUserActiveForecast = hasLatestActiveYes || hasLatestActiveNo;

  const questionYesDuration =
    new Date(question_yes.scheduled_close_time).getTime() -
    new Date(question_yes.open_time ?? question_yes.created_at).getTime();

  const questionNoDuration =
    new Date(question_no.scheduled_close_time).getTime() -
    new Date(question_no.open_time ?? question_no.created_at).getTime();

  const questionYesExpirationState = useExpirationModalState(
    questionYesDuration,
    question_yes.my_forecasts?.latest
  );

  const questionNoExpirationState = useExpirationModalState(
    questionNoDuration,
    question_no.my_forecasts?.latest
  );

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
  >(() =>
    getQuestionOptions(
      conditional,
      t,
      user?.prediction_expiration_percent ?? null
    )
  );

  // update options on revalidate path
  useEffect(() => {
    setQuestionOptions(() =>
      getQuestionOptions(
        conditional,
        t,
        user?.prediction_expiration_percent ?? null
      )
    );
  }, [conditional, t, user?.prediction_expiration_percent]);

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

  const questionDuration =
    activeTableOption === questionYesId
      ? questionYesDuration
      : questionNoDuration;

  const {
    modalSavedState,
    setModalSavedState,
    expirationShortChip,
    isForecastExpirationModalOpen,
    setIsForecastExpirationModalOpen,
    previousForecastExpiration,
  } =
    activeTableOption === questionYesId
      ? questionYesExpirationState
      : questionNoExpirationState;

  useEffect(() => {
    setQuestionOptions((prev) =>
      prev.map((option) => ({
        ...option,
        forecastExpiration:
          option.id === activeTableOption
            ? modalSavedState.forecastExpiration
            : option.forecastExpiration,
      }))
    );
  }, [activeTableOption, modalSavedState.forecastExpiration]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
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
                      option.question,
                      forecastInputMode
                    ),
                  }
                : {
                    value: getTableValue(
                      components,
                      option.question,
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
              question_yes
            ),
            sliderForecast: getInitialSliderDistributionComponents(
              latestYes,
              prevYesForecastValue,
              question_yes
            ),
            quantileValue: getTableValue(
              quantileForecast,
              question_yes,
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
              question_no
            ),
            sliderForecast: getInitialSliderDistributionComponents(
              latestNo,
              prevNoForecastValue,
              question_no
            ),
            quantileValue: getTableValue(
              quantileForecast,
              question_no,
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

  const handlePredictSubmit = async (
    forecastExpiration?: ForecastExpirationValue
  ) => {
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
          forecastExpiration: questionForecastExpiration,
        }) => ({
          questionId: question.id,
          forecastEndTime: forecastExpirationToDate(
            forecastExpiration ?? questionForecastExpiration
          ),
          forecastData: {
            continuousCdf:
              forecastInputMode === ContinuousForecastInputType.Quantile
                ? getQuantileNumericForecastDataset(quantileForecast, question)
                    .cdf
                : getSliderNumericForecastDataset(sliderForecast, question).cdf,
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
      sendConditionalPredictEvent(
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
                  prevChoice.question,
                  ContinuousForecastInputType.Slider
                ),
              }
            : {
                quantileValue: getTableValue(
                  quantileForecast,
                  prevChoice.question,
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
    onPredictionSubmit?.();
  };

  const handlePredictWithdraw = async () => {
    setSubmitError(undefined);

    if (!hasLatestActiveYes && !hasLatestActiveNo) return;

    const response = await withdrawForecasts(postId, [
      ...(hasLatestActiveYes ? [{ question: questionYesId }] : []),
      ...(hasLatestActiveNo ? [{ question: questionNoId }] : []),
    ]);
    setQuestionOptions((prev) =>
      prev.map((prevChoice) => ({ ...prevChoice, isDirty: false }))
    );

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
    setIsWithdrawModalOpen(false);
    onPredictionSubmit?.();
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
            option.question
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
      activeOptionData.question
    ).cdf;
  const userPreviousCdf: number[] | undefined =
    overlayPreviousForecast && previousForecast
      ? previousForecast.forecast_values.map((v) => {
          if (v === null) {
            throw new Error("Forecast values contain null values");
          }
          return v;
        })
      : undefined;
  const aggregateLatest =
    activeOptionData?.question.aggregations[
      activeOptionData.question.default_aggregation_method
    ].latest;
  const communityCdf: number[] | undefined =
    aggregateLatest && isForecastActive(aggregateLatest)
      ? aggregateLatest.forecast_values.map((v) => {
          if (v === null) {
            throw new Error("Forecast values contain null values");
          }
          return v;
        })
      : undefined;

  const predictButtonIsDisabled =
    activeOptionData?.forecastInputMode === ContinuousForecastInputType.Slider
      ? !questionsToSubmit.length
      : activeOptionData?.forecastInputMode ===
            ContinuousForecastInputType.Quantile && activeQuestion
        ? validateAllQuantileInputs({
            question: activeQuestion,
            components: activeOptionData.quantileForecast,
            t,
          }).length !== 0 || !isNil(submitError)
        : undefined;

  const predictButtonIsDirty =
    activeOptionData?.forecastInputMode ===
      ContinuousForecastInputType.Quantile && activeOptionData?.quantileForecast
      ? activeOptionData.quantileForecast.some((q) => q.isDirty)
      : isPickerDirty;

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
              ) : hasUserActiveForecast ? (
                <WithdrawButton
                  type="button"
                  isPromptOpen={isWithdrawModalOpen}
                  isPending={withdrawalIsPending}
                  onSubmit={withdraw}
                  onPromptVisibilityChange={setIsWithdrawModalOpen}
                >
                  {t("withdraw")}
                </WithdrawButton>
              ) : null}
            </>
          )}

          <PredictButton
            onSubmit={handlePredictSubmit}
            isUserForecastActive={hasUserActiveForecast}
            isDirty={predictButtonIsDirty}
            hasUserForecast={hasUserForecast}
            isPending={isSubmitting}
            predictLabel={previousForecast ? undefined : t("predict")}
            isDisabled={predictButtonIsDisabled}
            predictionExpirationChip={expirationShortChip}
            onPredictionExpirationClick={() =>
              setIsForecastExpirationModalOpen(true)
            }
          />
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

        {previousForecastExpiration && (
          <span
            className={cn(
              "text-center text-xs text-gray-800 dark:text-gray-800-dark",
              previousForecastExpiration.expiresSoon &&
                "text-salmon-800 dark:text-salmon-800-dark"
            )}
          >
            {previousForecastExpiration.isExpired
              ? t("predictionWithdrawnText", {
                  time: previousForecastExpiration.string,
                })
              : t("predictionWillBeWithdrawInText", {
                  time: previousForecastExpiration.string,
                })}
          </span>
        )}

        <div className="h-[32px]">
          {(isSubmitting || withdrawalIsPending) && <LoadingIndicator />}
        </div>
      </>
    );
  }

  return (
    <>
      <ForecastExpirationModal
        savedState={modalSavedState}
        setSavedState={setModalSavedState}
        isOpen={isForecastExpirationModalOpen}
        onClose={() => {
          setIsForecastExpirationModalOpen(false);
        }}
        onSubmit={handlePredictSubmit}
        isUserForecastActive={hasUserActiveForecast}
        isDirty={predictButtonIsDirty}
        hasUserForecast={hasUserForecast}
        isSubmissionDisabled={predictButtonIsDisabled}
        questionDuration={questionDuration}
      />

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
            return getTableDisplayValue(value, {
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
            <ForecastMakerConditionalResolutionMessage
              question={option.question}
              condition={condition}
            />
          </div>
        );
      })}
    </>
  );
};

function getUserQuartiles(
  question: Question,
  components?: DistributionSliderComponent[]
): Quartiles | null {
  if (!components) {
    return null;
  }

  const dataset = getSliderNumericForecastDataset(components, question);
  return computeQuartilesFromCDF(dataset.cdf);
}

function getTableValue(
  components:
    | DistributionSliderComponent[]
    | DistributionQuantileComponent
    | undefined,
  question: Question,
  forecastInputMode?: ContinuousForecastInputType
) {
  if (!components) {
    return null;
  }
  if (forecastInputMode === ContinuousForecastInputType.Quantile) {
    return (
      (components as DistributionQuantileComponent)?.find(
        (component) => component.quantile === Quantile.q2
      )?.value ?? null
    );
  }

  const quartiles = getUserQuartiles(
    question,
    components as DistributionSliderComponent[]
  );
  return quartiles?.median ?? null;
}

function getQuestionOptions(
  conditional: PostConditional<QuestionWithNumericForecasts>,
  t: ReturnType<typeof useTranslations>,
  userPredictionExpirationPercent: number | null
) {
  const { question_yes, question_no } = conditional;
  const questionYesId = question_yes.id;
  const questionNoId = question_no.id;
  const latestYes = question_yes.my_forecasts?.latest;
  const latestNo = question_no.my_forecasts?.latest;
  const prevYesForecastValue =
    latestYes && isForecastActive(latestYes)
      ? extractPrevNumericForecastValue(latestYes.distribution_input)
      : undefined;
  const prevNoForecastValue =
    latestNo && isForecastActive(latestNo)
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
                question_yes,
                ContinuousForecastInputType.Slider
              )
            : null,
          quantileValue: prevYesForecastValue
            ? getTableValue(
                quantileForecast,
                question_yes,
                ContinuousForecastInputType.Quantile
              )
            : null,
        };
      })(),
      isDirty: false,
      question: question_yes,
      forecastExpiration: buildDefaultForecastExpiration(
        question_yes,
        userPredictionExpirationPercent ?? undefined
      ),
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
                question_no,
                ContinuousForecastInputType.Slider
              )
            : null,
          quantileValue: prevNoForecastValue
            ? getTableValue(
                quantileForecast,
                question_no,
                ContinuousForecastInputType.Quantile
              )
            : null,
        };
      })(),
      isDirty: false,
      question: question_no,
      forecastExpiration: buildDefaultForecastExpiration(
        question_no,
        userPredictionExpirationPercent ?? undefined
      ),
    },
  ];
}

export default ForecastMakerConditionalContinuous;
