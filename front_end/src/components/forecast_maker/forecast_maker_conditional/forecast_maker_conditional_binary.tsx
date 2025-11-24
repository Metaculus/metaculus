"use client";
import { round } from "lodash";
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
import ForecastPredictionMessage from "@/components/forecast_maker/prediction_message";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { Post, PostConditional } from "@/types/post";
import { Question, QuestionWithNumericForecasts } from "@/types/question";
import { sendConditionalPredictEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts/initial_values";

import BinarySlider, { BINARY_FORECAST_PRECISION } from "../binary_slider";
import ConditionalForecastTable, {
  ConditionalTableOption,
} from "../conditional_forecast_table";
import {
  ForecastExpirationModal,
  forecastExpirationToDate,
  ForecastExpirationValue,
  useExpirationModalState,
} from "../forecast_expiration";
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

const ForecastMakerConditionalBinary: FC<Props> = ({
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

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const { condition, condition_child, question_yes, question_no } = conditional;
  const questionYesId = question_yes.id;
  const questionNoId = question_no.id;

  const latestYes = question_yes.my_forecasts?.latest;
  const latestNo = question_no.my_forecasts?.latest;

  const hasLatestActiveYes = latestYes && isForecastActive(latestYes);
  const hasLatestActiveNo = latestNo && isForecastActive(latestNo);

  const prevYesForecastValue = latestYes
    ? extractPrevBinaryForecastValue(latestYes.forecast_values[1])
    : null;
  const prevNoForecastValue = latestNo
    ? extractPrevBinaryForecastValue(latestNo.forecast_values[1])
    : null;
  const hasUserForecast = !!prevYesForecastValue || !!prevNoForecastValue;
  const hasUserActiveForecast = hasLatestActiveYes || hasLatestActiveNo;

  const latestAggregationYes =
    question_yes.aggregations[question_yes.default_aggregation_method].latest;
  const latestAggregationNo =
    question_no.aggregations[question_no.default_aggregation_method].latest;

  const prevYesAggregationValue =
    latestAggregationYes && isForecastActive(latestAggregationYes)
      ? latestAggregationYes.centers?.[0]
      : null;
  const prevNoAggregationValue =
    latestAggregationNo && isForecastActive(latestAggregationNo)
      ? latestAggregationNo.centers?.[0]
      : null;

  const [activeTableOption, setActiveTableOption] = useState(
    question_yes.resolution === "annulled" ? questionNoId : questionYesId
  );
  const activeQuestion = useMemo(
    () => [question_yes, question_no].find((q) => q.id === activeTableOption),
    [activeTableOption, question_yes, question_no]
  );

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

  const [questionOptions, setQuestionOptions] = useState<
    Array<
      ConditionalTableOption & {
        communitiesForecast?: number | null;
        question: Question;
      }
    >
  >([
    {
      id: questionYesId,
      name: t("ifYes"),
      value: prevYesForecastValue,
      isDirty: false,
      communitiesForecast: prevYesAggregationValue,
      question: question_yes,
      forecastExpiration:
        questionYesExpirationState.modalSavedState.forecastExpiration,
    },
    {
      id: questionNoId,
      name: t("ifNo"),
      value: prevNoForecastValue,
      isDirty: false,
      communitiesForecast: prevNoAggregationValue,
      question: question_no,
      forecastExpiration:
        questionNoExpirationState.modalSavedState.forecastExpiration,
    },
  ]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalSavedState.forecastExpiration]);

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

    if (!!inactiveOption?.value) {
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
            const fromChoiceValue =
              prev.find((prevChoice) => prevChoice.id === fromQuestionId)
                ?.value ??
              (condition_child.id === fromQuestionId &&
              condition_child.my_forecasts?.latest?.forecast_values[1]
                ? condition_child.my_forecasts.latest.forecast_values[1] * 100
                : null);

            return {
              ...prevChoice,
              value: fromChoiceValue ?? prevChoice.value,
              isDirty: true,
            };
          }

          return prevChoice;
        })
      );
    },
    [condition_child]
  );

  const resetForecasts = useCallback(() => {
    setQuestionOptions((prev) =>
      prev.map((prevChoice) => {
        if (prevChoice.id === questionYesId) {
          return {
            ...prevChoice,
            value: prevYesForecastValue,
            isDirty: false,
          };
        } else if (prevChoice.id === questionNoId) {
          return {
            ...prevChoice,
            value: prevNoForecastValue,
            isDirty: false,
          };
        } else {
          return prevChoice;
        }
      })
    );
  }, [prevNoForecastValue, prevYesForecastValue, questionNoId, questionYesId]);

  const handleForecastChange = useCallback(
    (questionId: number, forecast: number) => {
      setQuestionOptions((prev) =>
        prev.map((option) => {
          if (option.id === questionId) {
            return {
              ...option,
              value: forecast,
            };
          }

          return option;
        })
      );
    },
    []
  );
  const handleBecomeDirty = useCallback((questionId: number) => {
    setQuestionOptions((prev) =>
      prev.map((option) => {
        if (option.id === questionId) {
          return {
            ...option,
            isDirty: true,
          };
        }

        return option;
      })
    );
  }, []);

  const handlePredictSubmit = async (
    forecastExpiration?: ForecastExpirationValue
  ) => {
    setSubmitError(undefined);

    if (!questionsToSubmit.length) {
      return;
    }

    setIsSubmitting(true);
    const response = await createForecasts(
      postId,
      questionsToSubmit.map((q) => {
        // Okay to disable no-non-null-assertion rule, as value is checked in questionsToSubmit definition
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const forecastValue = round(q.value! / 100, BINARY_FORECAST_PRECISION);

        return {
          questionId: q.id,
          forecastEndTime: forecastExpirationToDate(
            forecastExpiration ?? q.forecastExpiration
          ),
          forecastData: {
            continuousCdf: null,
            probabilityYesPerCategory: null,
            probabilityYes: forecastValue,
          },
        };
      })
    );
    questionsToSubmit.forEach((q) => {
      sendConditionalPredictEvent(
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
    onPredictionSubmit?.();
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
    setIsWithdrawModalOpen(false);
    onPredictionSubmit?.();
  };
  const [withdraw, withdrawalIsPending] = useServerAction(
    handlePredictWithdraw
  );

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
        isDirty={isPickerDirty}
        hasUserForecast={hasUserForecast}
        isSubmissionDisabled={!questionsToSubmit.length}
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
        formatForecastValue={(value) => (value ? `${value}%` : "—")}
      />
      {questionOptions.map((option) => (
        <div
          key={option.id}
          className={cn("mt-10", option.id !== activeTableOption && "hidden")}
        >
          <BinarySlider
            forecast={option.value}
            onChange={(forecast) => handleForecastChange(option.id, forecast)}
            isDirty={option.isDirty}
            onBecomeDirty={() => handleBecomeDirty(option.id)}
            communityForecast={
              !user || !hideCP ? option.communitiesForecast : null
            }
            disabled={!canPredict}
          />
          <ForecastMakerConditionalResolutionMessage
            question={option.question}
            condition={condition}
          />
        </div>
      ))}
      <div className="my-5 flex flex-wrap items-center justify-center gap-3 px-4">
        <ForecastPredictionMessage predictionMessage={predictionMessage} />
        {canPredict && (
          <>
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
                {!!isPickerDirty ? (
                  <Button
                    variant="secondary"
                    type="reset"
                    onClick={resetForecasts}
                  >
                    {t("discardChangesButton")}
                  </Button>
                ) : hasUserActiveForecast ? (
                  <WithdrawButton
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
              isDirty={isPickerDirty}
              hasUserForecast={hasUserForecast}
              isPending={isSubmitting}
              isDisabled={!questionsToSubmit.length}
              predictionExpirationChip={expirationShortChip}
              onPredictionExpirationClick={() =>
                setIsForecastExpirationModalOpen(true)
              }
            />
          </>
        )}
      </div>

      {previousForecastExpiration && (
        <div
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
        </div>
      )}

      <FormError
        errors={submitError}
        className="flex items-center justify-center"
        detached
      />
    </>
  );
};

export default ForecastMakerConditionalBinary;
