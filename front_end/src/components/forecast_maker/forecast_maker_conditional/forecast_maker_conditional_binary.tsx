"use client";
import classNames from "classnames";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";
import React from "react";

import { createForecast } from "@/app/(main)/questions/actions";
import BinarySlider, {
  BINARY_FORECAST_PRECISION,
} from "@/components/forecast_maker/binary_slider";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { ErrorResponse } from "@/types/fetch";
import { PostConditional } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts";

import ConditionalForecastTable, {
  ConditionalTableOption,
} from "../conditional_forecast_table";

type Props = {
  conditional: PostConditional<QuestionWithNumericForecasts>;
  prevYesForecast?: any;
  prevNoForecast?: any;
};

const ForecastMakerConditionalBinary: FC<Props> = ({
  conditional,
  prevYesForecast,
  prevNoForecast,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const prevYesForecastValue = extractPrevBinaryForecastValue(prevYesForecast);
  const prevNoForecastValue = extractPrevBinaryForecastValue(prevNoForecast);

  const { question_yes, question_no } = conditional;
  const questionYesId = question_yes.id;
  const questionNoId = question_no.id;

  const [questionOptions, setQuestionOptions] = useState<
    Array<
      ConditionalTableOption & {
        communitiesForecast?: number | null;
      }
    >
  >([
    {
      id: questionYesId,
      name: t("Yes"),
      value: prevYesForecastValue,
      isDirty: false,
      communitiesForecast: question_yes.forecasts.values_mean.at(-1),
    },
    {
      id: questionNoId,
      name: t("No"),
      value: prevNoForecastValue,
      isDirty: false,
      communitiesForecast: question_no.forecasts.values_mean.at(-1),
    },
  ]);
  const [activeTableOption, setActiveTableOption] = useState(
    questionOptions.at(0)?.id ?? null
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse[]>([]);
  const isPickerDirty = useMemo(
    () => questionOptions.some((option) => option.isDirty),
    [questionOptions]
  );
  const forecastsToSubmit = useMemo(
    () =>
      questionOptions.filter(
        (option) => option.isDirty && option.value !== null
      ),
    [questionOptions]
  );
  const submitIsAllowed = !isSubmitting && !!forecastsToSubmit.length;

  const copyForecastButton = useMemo(() => {
    if (!activeTableOption) return null;

    const inactiveOption = questionOptions.find(
      (option) => option.id !== activeTableOption
    );

    if (!inactiveOption || inactiveOption.value === null) {
      return null;
    }

    return {
      label: `Copy from IF ${inactiveOption.name.toUpperCase()}`,
      fromQuestionId: inactiveOption.id,
      toQuestionId: activeTableOption,
    };
  }, [activeTableOption, questionOptions]);

  const copyForecast = useCallback(
    (fromQuestionId: number, toQuestionId: number) => {
      setQuestionOptions((prev) =>
        prev.map((prevChoice) => {
          if (prevChoice.id === toQuestionId) {
            const fromChoiceValue = prev.find(
              (prevChoice) => prevChoice.id === fromQuestionId
            )?.value;

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
    []
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
    setSubmitErrors([]);

    if (!forecastsToSubmit.length) {
      return;
    }

    const promises = forecastsToSubmit.map((forecast) => {
      const forecastValue = round(
        forecast.value! / 100,
        BINARY_FORECAST_PRECISION
      );
      return createForecast(
        forecast.id,
        {
          continuousCdf: null,
          probabilityYesPerCategory: null,
          probabilityYes: forecastValue,
        },
        forecastValue
      );
    });
    setIsSubmitting(true);
    const responses = await Promise.all(promises);
    setIsSubmitting(false);

    const errors: ErrorResponse[] = [];
    for (const response of responses) {
      if ("errors" in response && !!response.errors) {
        errors.push(response.errors);
      }
    }
    if (errors.length) {
      setSubmitErrors(errors);
    }
  };

  return (
    <>
      <ConditionalForecastTable
        condition={conditional.condition}
        childQuestion={conditional.question_yes}
        options={questionOptions}
        value={activeTableOption}
        onChange={setActiveTableOption}
        formatForecastValue={(value) => (value ? `${value}%` : "—")}
      />
      {questionOptions.map((option) => (
        <div
          key={option.id}
          className={classNames(
            "mt-10",
            option.id !== activeTableOption && "hidden"
          )}
        >
          <BinarySlider
            forecast={option.value}
            onChange={(forecast) => handleForecastChange(option.id, forecast)}
            isDirty={option.isDirty}
            onBecomeDirty={() => handleBecomeDirty(option.id)}
            communityForecast={option.communitiesForecast}
          />
        </div>
      ))}
      <div className="my-5 flex items-center justify-center gap-3 px-4">
        {user ? (
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
            <Button
              variant="primary"
              type="submit"
              onClick={handlePredictSubmit}
              disabled={!submitIsAllowed}
            >
              {t("saveButton")}
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            type="button"
            onClick={() => setCurrentModal({ type: "signup" })}
          >
            {t("signUpButton")}
          </Button>
        )}
      </div>
      {submitErrors.map((errResponse, index) => (
        <FormError key={`error-${index}`} errors={errResponse} />
      ))}
    </>
  );
};

export default ForecastMakerConditionalBinary;
