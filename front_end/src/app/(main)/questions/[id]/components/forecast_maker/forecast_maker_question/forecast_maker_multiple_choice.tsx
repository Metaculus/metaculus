"use client";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { ErrorResponse } from "@/types/fetch";
import { ProjectPermissions } from "@/types/post";
import {
  AggregateForecastHistory,
  Question,
  QuestionWithMultipleChoiceForecasts,
  UserForecastHistory,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { extractPrevMultipleChoicesForecastValue } from "@/utils/forecasts";
import { sortMultipleChoicePredictions } from "@/utils/questions";

import {
  BINARY_FORECAST_PRECISION,
  BINARY_MAX_VALUE,
  BINARY_MIN_VALUE,
} from "../binary_slider";
import ForecastChoiceOption from "../forecast_choice_option";
import QuestionResolutionButton from "../resolution";

type ChoiceOption = {
  name: string;
  communityForecast?: number | null;
  forecast: number | null;
  color: ThemeColor;
};

type Props = {
  postId: number;
  question: QuestionWithMultipleChoiceForecasts;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerMultipleChoice: FC<Props> = ({
  postId,
  question,
  permission,
  canPredict,
  canResolve,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const [isDirty, setIsDirty] = useState(false);
  const [choicesForecasts, setChoicesForecasts] = useState<ChoiceOption[]>(
    generateChoiceOptions(
      question,
      question.aggregations.recency_weighted,
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorResponse>();

  const resetForecasts = useCallback(() => {
    setIsDirty(false);
    setChoicesForecasts((prev) =>
      prev.map((prevChoice) => ({
        ...prevChoice,
        forecast: getDefaultForecast(
          prevChoice.name,
          question.my_forecasts?.latest?.slider_values
        ),
      }))
    );
  }, [question.my_forecasts?.latest?.slider_values]);
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

  const submitIsAllowed = !isSubmitting && isDirty && isForecastValid;
  const handlePredictSubmit = async () => {
    setSubmitError(undefined);

    if (!user) {
      setCurrentModal({ type: "signup" });
      return;
    }

    if (!isForecastValid) return;

    const forecastValue: Record<string, number> = {};
    choicesForecasts.forEach((el) => {
      forecastValue[el.name] = round(
        el.forecast! / 100,
        BINARY_FORECAST_PRECISION
      );
    });

    setIsSubmitting(true);
    const response = await createForecasts(postId, [
      {
        questionId: question.id,
        forecastData: {
          continuousCdf: null,
          probabilityYes: null,
          probabilityYesPerCategory: forecastValue,
        },
        sliderValues: forecastValue,
      },
    ]);
    setIsDirty(false);
    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors[0]);
    }
    setIsSubmitting(false);
  };

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
              communityForecast={choice.communityForecast}
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

      <div className="my-5 flex flex-wrap items-center justify-center gap-4 border-b border-b-blue-400 pb-5 dark:border-b-blue-400-dark">
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
                {t("rescalePredictionButton")}
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
            <Button
              variant="primary"
              type="submit"
              disabled={!submitIsAllowed}
              onClick={handlePredictSubmit}
            >
              {user ? t("saveButton") : t("signUpButton")}
            </Button>
          </div>
        )}
        <FormErrorMessage errors={submitError} />
      </div>
      <div className="flex flex-col items-center justify-center">
        <QuestionResolutionButton question={question} permission={permission} />
      </div>
    </>
  );
};

function generateChoiceOptions(
  question: Question,
  aggregate: AggregateForecastHistory,
  my_forecasts: UserForecastHistory
): ChoiceOption[] {
  const latest = aggregate.latest;
  const choiceOrdering: number[] = question.options!.map((_, i) => i);
  choiceOrdering.sort((a, b) => {
    const aCenter = latest?.forecast_values[a] ?? 0;
    const bCenter = latest?.forecast_values[b] ?? 0;
    return bCenter - aCenter;
  });
  return choiceOrdering.map((order, index) => {
    return {
      name: question.options![order],
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      communityForecast: latest?.forecast_values[order] ?? null,
      forecast: my_forecasts.latest
        ? Math.round(my_forecasts.latest.forecast_values[order] * 1000) / 10
        : null,
    };
  });
}

function getDefaultForecast(
  option: string,
  defaultForecasts: Record<string, number> | null
) {
  const defaultForecast = defaultForecasts?.[option];
  return defaultForecast ? round(defaultForecast * 100, 1) : null;
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
