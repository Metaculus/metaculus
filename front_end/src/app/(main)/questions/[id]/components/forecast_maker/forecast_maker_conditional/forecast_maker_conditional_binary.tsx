"use client";
import { round } from "lodash";
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
import { QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/cn";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts";

import { sendGAConditionalPredictEvent } from "./ga_events";
import { useHideCP } from "../../cp_provider";
import BinarySlider, { BINARY_FORECAST_PRECISION } from "../binary_slider";
import ConditionalForecastTable, {
  ConditionalTableOption,
} from "../conditional_forecast_table";
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

const ForecastMakerConditionalBinary: FC<Props> = ({
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
      ? extractPrevBinaryForecastValue(latestYes.forecast_values[1])
      : null;
  const prevNoForecastValue =
    latestNo && !latestNo.end_time
      ? extractPrevBinaryForecastValue(latestNo.forecast_values[1])
      : null;
  const hasUserForecast = !!prevYesForecastValue || !!prevNoForecastValue;

  const latestAggregationYes =
    question_yes.aggregations?.recency_weighted.latest;
  const latestAggregationNo = question_no.aggregations?.recency_weighted.latest;

  const prevYesAggregationValue =
    latestAggregationYes && !latestAggregationYes.end_time
      ? latestAggregationYes.centers?.[0]
      : null;
  const prevNoAggregationValue =
    latestAggregationNo && !latestAggregationNo.end_time
      ? latestAggregationNo.centers?.[0]
      : null;

  const [questionOptions, setQuestionOptions] = useState<
    Array<
      ConditionalTableOption & {
        communitiesForecast?: number | null;
      }
    >
  >([
    {
      id: questionYesId,
      name: t("ifYes"),
      value: prevYesForecastValue,
      isDirty: false,
      communitiesForecast: prevYesAggregationValue,
    },
    {
      id: questionNoId,
      name: t("ifNo"),
      value: prevNoForecastValue,
      isDirty: false,
      communitiesForecast: prevNoAggregationValue,
    },
  ]);

  const [activeTableOption, setActiveTableOption] = useState(
    question_yes.resolution === "annulled" ? questionNoId : questionYesId
  );
  const activeQuestion = useMemo(
    () => [question_yes, question_no].find((q) => q.id === activeTableOption),
    [activeTableOption, question_yes, question_no]
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

  const handlePredictSubmit = async () => {
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
          forecastData: {
            continuousCdf: null,
            probabilityYesPerCategory: null,
            probabilityYes: forecastValue,
          },
        };
      })
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
        </div>
      ))}
      <div className="my-5 flex flex-wrap items-center justify-center gap-3 px-4">
        {predictionMessage && (
          <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
            {predictionMessage}
          </div>
        )}
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
                <Button
                  variant="secondary"
                  type="reset"
                  onClick={resetForecasts}
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
            />
          </>
        )}
      </div>
      <FormError
        errors={submitError}
        className="flex items-center justify-center"
        detached
      />
      {activeQuestion && <ScoreDisplay question={activeQuestion} />}
    </>
  );
};

export default ForecastMakerConditionalBinary;
