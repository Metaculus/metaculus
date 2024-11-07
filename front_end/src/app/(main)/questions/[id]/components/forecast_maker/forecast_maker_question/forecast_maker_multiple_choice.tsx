"use client";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil, round } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { useAuth } from "@/contexts/auth_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import {
  AggregateForecastHistory,
  PredictionInputMessage,
  Question,
  QuestionWithMultipleChoiceForecasts,
  UserForecastHistory,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";

import { sendGAPredictEvent } from "./ga_events";
import { useHideCP } from "../../cp_provider";
import {
  BINARY_FORECAST_PRECISION,
  BINARY_MAX_VALUE,
  BINARY_MIN_VALUE,
} from "../binary_slider";
import ForecastChoiceOption from "../forecast_choice_option";
import PredictButton from "../predict_button";
import QuestionResolutionButton from "../resolution";
import QuestionUnresolveButton from "../resolution/unresolve_button";

type ChoiceOption = {
  name: string;
  communityForecast?: number | null;
  forecast: number | null;
  color: ThemeColor;
};

type Props = {
  post: PostWithForecasts;
  question: QuestionWithMultipleChoiceForecasts;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage: PredictionInputMessage;
};

const ForecastMakerMultipleChoice: FC<Props> = ({
  post,
  question,
  permission,
  canPredict,
  canResolve,
  predictionMessage,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hideCP } = useHideCP();

  const choiceOrdering = useMemo(() => {
    const latest = question.aggregations.recency_weighted.latest;
    const choiceOrdering: number[] = question.options!.map((_, i) => i);
    choiceOrdering.sort((a, b) => {
      const aCenter = latest?.forecast_values[a] ?? 0;
      const bCenter = latest?.forecast_values[b] ?? 0;
      return bCenter - aCenter;
    });

    return choiceOrdering;
  }, [question.aggregations.recency_weighted.latest, question.options]);

  const [isDirty, setIsDirty] = useState(false);
  const [choicesForecasts, setChoicesForecasts] = useState<ChoiceOption[]>(
    generateChoiceOptions(
      question,
      question.aggregations.recency_weighted,
      choiceOrdering,
      question.my_forecasts ?? { history: [] }
    )
  );

  const equalizedForecast = useMemo(
    () => round(100 / choicesForecasts.length, 1),
    [choicesForecasts.length]
  );
  const forecastHasValues = useMemo(
    () => choicesForecasts.every((el) => el.forecast !== null),
    [choicesForecasts]
  );
  const forecastsSum = useMemo(
    () => (forecastHasValues ? sumForecasts(choicesForecasts) : null),
    [choicesForecasts, forecastHasValues]
  );
  const remainingSum = forecastsSum ? 100 - forecastsSum : null;
  const isForecastValid = forecastHasValues && forecastsSum === 100;

  const [submitError, setSubmitError] = useState<ErrorResponse>();

  const resetForecasts = useCallback(() => {
    setIsDirty(false);
    setChoicesForecasts((prev) =>
      choiceOrdering.map((order, index) => {
        const choiceOption = prev[index];
        const userForecast =
          question.my_forecasts?.latest?.forecast_values[order] ?? null;

        return {
          ...choiceOption,
          forecast: !isNil(userForecast)
            ? Math.round(userForecast * 1000) / 10
            : null,
        };
      })
    );
  }, [choiceOrdering, question.my_forecasts?.latest?.forecast_values]);
  const handleForecastChange = useCallback(
    (choice: string, value: number) => {
      setIsDirty(true);
      setChoicesForecasts((prev) =>
        prev.map((prevChoice) => {
          if (prevChoice.name === choice) {
            return { ...prevChoice, forecast: value };
          }

          const isInitialChange = prev.some((el) => el.forecast === null);

          if (isInitialChange) {
            // User is predicting for the first time. Show default non-null values
            // for remaining options after first interaction with the inputs.
            return { ...prevChoice, forecast: equalizedForecast };
          }

          return prevChoice;
        })
      );
    },
    [equalizedForecast]
  );

  const rescaleForecasts = () => {
    if (!forecastHasValues || !forecastsSum === null) return;

    // Due to floating point arithmetic, the sum may be slightly off. We fix
    // this by adjusting the max prediction to guarantee the sum is 1.
    let adjustIndex = 0;
    let maxValue = 0;
    const newForecasts = choicesForecasts.map((choice, index) => {
      const value = round(
        Math.max(round((100 * choice.forecast!) / forecastsSum!, 1), 0.1),
        1
      );
      if (value > maxValue) {
        adjustIndex = index;
        maxValue = value;
      }
      return value;
    });

    newForecasts[adjustIndex] = Math.max(
      round(
        newForecasts[adjustIndex] +
          100 -
          newForecasts.reduce((acc, value) => acc + value, 0),
        1
      ),
      0.1
    );

    setChoicesForecasts((prev) =>
      prev.map((choice, index) => ({
        ...choice,
        forecast: newForecasts[index] ?? choice.forecast,
      }))
    );
  };

  const handlePredictSubmit = async () => {
    setSubmitError(undefined);

    if (!isForecastValid) return;

    const forecastValue: Record<string, number> = {};
    choicesForecasts.forEach((el) => {
      forecastValue[el.name] = round(
        el.forecast! / 100,
        BINARY_FORECAST_PRECISION
      );
    });
    sendGAPredictEvent(post, question, hideCP);
    const response = await createForecasts(post.id, [
      {
        questionId: question.id,
        forecastData: {
          continuousCdf: null,
          probabilityYes: null,
          probabilityYesPerCategory: forecastValue,
        },
      },
    ]);
    setIsDirty(false);
    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors[0]);
    }
  };
  const [submit, isPending] = useServerAction(handlePredictSubmit);
  return (
    <>
      <table className="border-separate rounded border border-gray-300 bg-gray-0 dark:border-gray-300-dark dark:bg-gray-0-dark">
        <thead>
          <tr>
            <th className="bg-blue-100 p-2 text-left text-xs font-bold dark:bg-blue-100-dark">
              {t("Candidates")}
            </th>
            <th className="bg-blue-100 p-2 pr-4 text-right text-xs dark:bg-blue-100-dark">
              <FontAwesomeIcon
                icon={faUserGroup}
                size="sm"
                className="align-middle text-olive-700 dark:text-olive-700-dark"
              />
            </th>
            <th
              className="hidden bg-blue-100 p-2 text-left text-xs font-bold text-orange-800 dark:bg-blue-100-dark dark:text-orange-800-dark sm:table-cell"
              colSpan={2}
            >
              My Prediction
            </th>
            <th className="bg-blue-100 p-2 text-center text-xs font-bold text-orange-800 dark:bg-blue-100-dark dark:text-orange-800-dark sm:hidden">
              Me
            </th>
          </tr>
        </thead>
        <tbody>
          {choicesForecasts.map((choice) => (
            <ForecastChoiceOption
              key={choice.name}
              id={choice.name}
              forecastValue={choice.forecast}
              defaultSliderValue={equalizedForecast}
              choiceName={choice.name}
              choiceColor={choice.color}
              communityForecast={
                !user || !hideCP ? choice.communityForecast : null
              }
              inputMin={BINARY_MIN_VALUE}
              inputMax={BINARY_MAX_VALUE}
              onChange={handleForecastChange}
              isDirty={isDirty}
              disabled={!canPredict}
              optionResolution={{
                type: "question",
                resolution: question.resolution,
              }}
            />
          ))}
        </tbody>
      </table>
      {predictionMessage && (
        <div className="my-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {t(predictionMessage)}
        </div>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 border-b border-b-blue-400 pb-5 dark:border-b-blue-400-dark">
        <div className="mx-auto text-center sm:ml-0 sm:text-left">
          <div>
            <span className="text-2xl font-bold">
              Total: {getForecastPctString(forecastsSum)}
            </span>
          </div>
          <span className="mt-1 text-sm">
            ({getForecastPctString(remainingSum)} remaining)
          </span>
        </div>
        {canPredict && (
          <div className="flex flex-wrap justify-center gap-2">
            <div className="w-full text-center sm:w-auto">
              <Button
                className="h-8"
                variant="link"
                type="button"
                onClick={rescaleForecasts}
                disabled={!forecastHasValues || isForecastValid}
              >
                {t("rescalePrediction")}
              </Button>
            </div>
            <Button
              variant="secondary"
              type="reset"
              onClick={resetForecasts}
              disabled={!isDirty}
            >
              {t("discardChangesButton")}
            </Button>
            <PredictButton
              onSubmit={submit}
              isDirty={isDirty}
              hasUserForecast={forecastHasValues}
              isPending={isPending}
              isDisabled={!isForecastValid}
            />
          </div>
        )}
      </div>
      <FormErrorMessage
        className="ml-auto mt-2 flex w-full justify-center"
        errors={submitError}
      />
      <div className="h-[32px] w-full">{isPending && <LoadingIndicator />}</div>
      <div className="flex flex-col items-center justify-center">
        <QuestionUnresolveButton question={question} permission={permission} />

        {canResolve && (
          <QuestionResolutionButton
            question={question}
            permission={permission}
          />
        )}
      </div>
    </>
  );
};

function generateChoiceOptions(
  question: Question,
  aggregate: AggregateForecastHistory,
  choiceOrdering: number[],
  my_forecasts: UserForecastHistory
): ChoiceOption[] {
  const latest = aggregate.latest;

  const choiceItems = choiceOrdering.map((order, index) => {
    return {
      name: question.options![order],
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      communityForecast: latest?.forecast_values[order] ?? null,
      forecast: my_forecasts.latest
        ? Math.round(my_forecasts.latest.forecast_values[order] * 1000) / 10
        : null,
    };
  });
  const resolutionIndex = choiceOrdering.findIndex(
    (order) => question.options![order] === question.resolution
  );
  if (resolutionIndex !== -1) {
    const [resolutionItem] = choiceItems.splice(resolutionIndex, 1);
    choiceItems.unshift(resolutionItem);
  }
  return choiceItems;
}

function sumForecasts(choiceOptions: ChoiceOption[]) {
  return choiceOptions.reduce((acc, { forecast }) => {
    // Handle JS math of float numbers
    return (acc * 10 + Number(forecast) * 10) / 10;
  }, 0);
}

function getForecastPctString(number: number | null) {
  if (number === null) return "?";

  return `${round(number, 1)}%`;
}

export default ForecastMakerMultipleChoice;
