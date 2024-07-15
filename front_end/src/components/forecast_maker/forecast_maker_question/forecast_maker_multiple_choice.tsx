"use client";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import percentRound from "percent-round";
import { FC, useCallback, useMemo, useState } from "react";

import { createForecast } from "@/app/(main)/questions/actions";
import QuestionResolutionButton from "@/components/forecast_maker/resolution";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { ErrorResponse } from "@/types/fetch";
import { ProjectPermissions } from "@/types/post";
import {
  MultipleChoiceForecast,
  QuestionWithMultipleChoiceForecasts,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";

import {
  BINARY_FORECAST_PRECISION,
  BINARY_MAX_VALUE,
  BINARY_MIN_VALUE,
} from "../binary_slider";
import ForecastChoiceOption from "../forecast_choice_option";

type ChoiceOption = {
  name: string;
  communityForecast: number | null;
  forecast: number | null;
  color: ThemeColor;
};

type Props = {
  question: QuestionWithMultipleChoiceForecasts;
  prevForecast?: any;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerMultipleChoice: FC<Props> = ({
  question,
  permission,
  prevForecast,
  canPredict,
  canResolve,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const prevForecastValue =
    Array.isArray(prevForecast) &&
    prevForecast.every((el) => typeof el === "number")
      ? (prevForecast as number[])
      : undefined;

  const [isDirty, setIsDirty] = useState(false);
  const [choicesForecasts, setChoicesForecasts] = useState<ChoiceOption[]>(
    generateChoiceOptions(question.forecasts, prevForecastValue)
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
      prev.map((prevChoice, index) => ({
        ...prevChoice,
        forecast: getDefaultForecast(index, prevForecastValue),
      }))
    );
  }, [prevForecastValue]);
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

    const newForecasts = percentRound(
      choicesForecasts.map((choice) => choice.forecast!)
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

    const forecastValue = choicesForecasts.map((el) =>
      round(el.forecast! / 100, BINARY_FORECAST_PRECISION)
    );

    setIsSubmitting(true);
    const response = await createForecast(
      question.id,
      {
        continuousCdf: null,
        probabilityYes: null,
        probabilityYesPerCategory: forecastValue,
      },
      forecastValue
    );
    setIsDirty(false);
    if ("errors" in response) {
      setSubmitError(response.errors);
    }
    setIsSubmitting(false);
  };

  return (
    <section className="bg-blue-200 p-3 dark:bg-blue-200-dark">
      <h3 className="m-0 text-base font-normal leading-5">
        {t("MakePrediction")}
      </h3>
      <table className="mt-3 border-separate rounded border border-gray-300 bg-gray-0 dark:border-gray-300-dark dark:bg-gray-0-dark">
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
              min={BINARY_MIN_VALUE}
              max={BINARY_MAX_VALUE}
              onChange={handleForecastChange}
              isDirty={isDirty}
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
        <FormError errors={submitError} />
      </div>
      <div className="flex flex-col items-center justify-center">
        <QuestionResolutionButton question={question} permission={permission} />
      </div>
    </section>
  );
};

function generateChoiceOptions(
  dataset: MultipleChoiceForecast,
  defaultForecasts?: number[]
): ChoiceOption[] {
  const {
    timestamps,
    nr_forecasters,
    my_forecasts,
    latest_pmf,
    latest_cdf,
    ...choices
  } = dataset;
  return Object.entries(choices).map(([choice, values], index) => ({
    name: choice,
    color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
    communityForecast: values.at(-1)?.value_mean ?? null,
    forecast: getDefaultForecast(index, defaultForecasts),
  }));
}

function getDefaultForecast(index: number, defaultForecasts?: number[]) {
  const defaultForecast = defaultForecasts?.[index];
  return defaultForecast ? round(defaultForecast * 100, 1) : null;
}

function sumForecasts(choiceOptions: ChoiceOption[]) {
  return choiceOptions.reduce((acc, { forecast }) => acc + Number(forecast), 0);
}

function getForecastPctString(number: number | null) {
  if (number === null) return "?";

  return `${round(number, 1)}%`;
}

export default ForecastMakerMultipleChoice;
