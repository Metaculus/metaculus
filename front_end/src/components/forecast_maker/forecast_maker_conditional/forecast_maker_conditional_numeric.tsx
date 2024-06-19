"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import ConditionalForecastTable, {
  ConditionalTableOption,
} from "@/components/forecast_maker/conditional_forecast_table";
import NumericSlider from "@/components/forecast_maker/numeric_slider";
import NumericForecastTable from "@/components/forecast_maker/numeric_table";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { ErrorResponse } from "@/types/fetch";
import { PostConditional } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import {
  extractPrevNumericForecastValue,
  getNumericForecastDataset,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

type Props = {
  postId: number;
  conditional: PostConditional<QuestionWithNumericForecasts>;
  prevYesForecast?: any;
  prevNoForecast?: any;
};

const ForecastMakerConditionalNumeric: FC<Props> = ({
  postId,
  conditional,
  prevYesForecast,
  prevNoForecast,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const { question_yes, question_no } = conditional;
  const questionYesId = question_yes.id;
  const questionNoId = question_no.id;

  const prevYesForecastValue = extractPrevNumericForecastValue(prevYesForecast);
  const prevNoForecastValue = extractPrevNumericForecastValue(prevNoForecast);

  const [questionOptions, setQuestionOptions] = useState<
    Array<
      ConditionalTableOption & {
        question: QuestionWithNumericForecasts;
        sliderForecast: MultiSliderValue[];
        weights: number[];
      }
    >
  >(() => [
    {
      id: questionYesId,
      name: t("Yes"),
      value: getTableValue(
        prevYesForecastValue?.forecast,
        prevYesForecastValue?.weights
      ),
      sliderForecast: getSliderValue(prevYesForecastValue?.forecast),
      weights: getWeightsValue(prevYesForecastValue?.weights),
      isDirty: false,
      question: question_yes,
    },
    {
      id: questionNoId,
      name: t("No"),
      value: getTableValue(
        prevNoForecastValue?.forecast,
        prevNoForecastValue?.weights
      ),
      sliderForecast: getSliderValue(prevNoForecastValue?.forecast),
      weights: getWeightsValue(prevNoForecastValue?.weights),
      isDirty: false,
      question: question_no,
    },
  ]);
  const [activeTableOption, setActiveTableOption] = useState(
    questionOptions.at(0)?.id ?? null
  );
  const activeOptionData = useMemo(
    () => questionOptions.find((option) => option.id === activeTableOption),
    [activeTableOption, questionOptions]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse[]>([]);
  const isPickerDirty = useMemo(
    () => questionOptions.some((option) => option.isDirty),
    [questionOptions]
  );
  const questionsToSubmit = useMemo(
    () =>
      questionOptions.filter(
        (option) => option.isDirty && option.value !== null
      ),
    [questionOptions]
  );
  const submitIsAllowed = !isSubmitting && !!questionsToSubmit.length;

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
            const fromChoiceOption = prev.find(
              (prevChoice) => prevChoice.id === fromQuestionId
            );

            return {
              ...prevChoice,
              value: fromChoiceOption?.value ?? prevChoice.value,
              sliderForecast:
                fromChoiceOption?.sliderForecast ?? prevChoice.sliderForecast,
              weights: fromChoiceOption?.weights ?? prevChoice.weights,
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
    (optionId: number, forecast: MultiSliderValue[], weights: number[]) => {
      setQuestionOptions((prev) =>
        prev.map((option) => {
          if (option.id === optionId) {
            return {
              ...option,
              value: getTableValue(option.sliderForecast, option.weights),
              isDirty: true,
              sliderForecast: forecast,
              weights,
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
              { left: 0.4, center: 0.5, right: 0.6 },
            ],
            weights: normalizeWeights([...prevChoice.weights, 1]),
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
              prevYesForecastValue?.forecast,
              prevYesForecastValue?.weights
            ),
            sliderForecast: getSliderValue(prevYesForecastValue?.forecast),
            weights: getWeightsValue(prevYesForecastValue?.weights),
            isDirty: false,
          };
        } else if (prevChoice.id === questionNoId) {
          return {
            ...prevChoice,
            value: getTableValue(
              prevNoForecastValue?.forecast,
              prevNoForecastValue?.weights
            ),
            sliderForecast: getSliderValue(prevNoForecastValue?.forecast),
            weights: getWeightsValue(prevNoForecastValue?.weights),
            isDirty: false,
          };
        } else {
          return prevChoice;
        }
      })
    );
  }, [
    prevNoForecastValue?.forecast,
    prevNoForecastValue?.weights,
    prevYesForecastValue?.forecast,
    prevYesForecastValue?.weights,
    questionNoId,
    questionYesId,
  ]);

  const handlePredictSubmit = async () => {
    setSubmitErrors([]);

    if (!questionsToSubmit.length) {
      return;
    }

    setIsSubmitting(true);
    const responses = await createForecasts(
      postId,
      questionsToSubmit.map(({ id, sliderForecast, weights }) => ({
        questionId: id,
        forecastData: {
          continuousCdf: getNumericForecastDataset(sliderForecast, weights).cdf,
          probabilityYesPerCategory: null,
          probabilityYes: null,
        },
        sliderValues: {
          forecast: sliderForecast,
          weights,
        },
      }))
    );
    setQuestionOptions((prev) =>
      prev.map((prevChoice) => ({ ...prevChoice, isDirty: false }))
    );
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
        formatForecastValue={(value) =>
          value ? `${Math.round(value * 1000) / 100}` : "—"
        }
      />
      {questionOptions.map((option) => (
        <div
          key={option.id}
          className={classNames(
            "mt-10",
            option.id !== activeTableOption && "hidden"
          )}
        >
          <NumericSlider
            question={option.question}
            forecast={option.sliderForecast}
            weights={option.weights}
            dataset={getNumericForecastDataset(
              option.sliderForecast,
              option.weights
            )}
            onChange={(forecast, weight) =>
              handleChange(option.id, forecast, weight)
            }
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
      {!!activeOptionData && (
        <NumericForecastTable
          cdf={
            getNumericForecastDataset(
              activeOptionData.sliderForecast,
              activeOptionData.weights
            ).cdf
          }
          latestCdf={activeOptionData.question.forecasts.latest_cdf}
        />
      )}
    </>
  );
};

function getTableValue(forecast?: MultiSliderValue[], weight?: number[]) {
  if (!forecast || !weight) {
    return null;
  }

  const dataset = getNumericForecastDataset(forecast, weight);
  const quartiles = computeQuartilesFromCDF(dataset.cdf);
  return quartiles.median;
}

function getSliderValue(forecast?: MultiSliderValue[]) {
  return (
    forecast ?? [
      {
        left: 0.4,
        center: 0.5,
        right: 0.6,
      },
    ]
  );
}

function getWeightsValue(weights?: number[]) {
  return weights ?? [1];
}

function normalizeWeights(weights: number[]) {
  return weights.map((x) => x / weights.reduce((a, b) => a + b));
}

export default ForecastMakerConditionalNumeric;
