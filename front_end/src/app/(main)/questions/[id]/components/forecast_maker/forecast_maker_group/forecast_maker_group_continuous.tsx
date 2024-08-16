"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { differenceInMilliseconds } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { ErrorResponse } from "@/types/fetch";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import {
  extractPrevNumericForecastValue,
  getNumericForecastDataset,
  normalizeWeights,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";
import { extractQuestionGroupName, formatResolution } from "@/utils/questions";

import ForecastMakerGroupControls from "./forecast_maker_group_menu";
import ContinuousSlider from "../continuous_slider";
import GroupForecastTable, {
  ConditionalTableOption,
} from "../group_forecast_table";
import NumericForecastTable from "../numeric_table";

type Props = {
  post: PostWithForecasts;
  questions: QuestionWithNumericForecasts[];
  canPredict: boolean;
  canResolve: boolean;
};

const ForecastMakerGroupContinuous: FC<Props> = ({
  post,
  questions,
  canPredict,
  canResolve,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const { id: postId, user_permission: permission } = post;

  const prevForecastValuesMap = useMemo(
    () =>
      questions.reduce<
        Record<number, { forecast?: MultiSliderValue[]; weights?: number[] }>
      >(
        (acc, question) => ({
          ...acc,
          [question.id]: extractPrevNumericForecastValue(
            question.my_forecasts.latest?.slider_values
          ),
        }),
        {}
      ),
    [questions]
  );

  const [groupOptions, setGroupOptions] = useState<ConditionalTableOption[]>(
    generateGroupOptions(questions, prevForecastValuesMap)
  );

  useEffect(() => {
    setGroupOptions(
      generateGroupOptions(questions, prevForecastValuesMap, permission)
    );
  }, [permission, prevForecastValuesMap, questions]);

  const [activeTableOption, setActiveTableOption] = useState(
    groupOptions.at(0)?.id ?? null
  );
  const activeGroupOption = useMemo(
    () => groupOptions.find((o) => o.id === activeTableOption),
    [groupOptions, activeTableOption]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse[]>([]);
  const questionsToSubmit = useMemo(
    () =>
      groupOptions.filter(
        (option) => option.isDirty && option.userForecast !== null
      ),
    [groupOptions]
  );
  const submitIsAllowed = !isSubmitting && !!questionsToSubmit.length;
  const isPickerDirty = useMemo(
    () => groupOptions.some((option) => option.isDirty),
    [groupOptions]
  );

  const handleChange = useCallback(
    (optionId: number, forecast: MultiSliderValue[], weights: number[]) => {
      setGroupOptions((prev) =>
        prev.map((option) => {
          if (option.id === optionId) {
            return {
              ...option,
              userQuartiles: getUserQuartiles(
                forecast,
                weights,
                option.question.open_lower_bound,
                option.question.open_upper_bound
              ),
              userForecast: forecast,
              userWeights: weights,
              isDirty: true,
            };
          }

          return option;
        })
      );
    },
    []
  );

  const handleAddComponent = useCallback((optionId: number) => {
    setGroupOptions((prev) =>
      prev.map((prevChoice) => {
        if (prevChoice.id === optionId) {
          const newUserForecast = [
            ...prevChoice.userForecast,
            { left: 0.4, center: 0.5, right: 0.6 },
          ];
          const newWeights = normalizeWeights([...prevChoice.userWeights, 1]);
          const newUserQuartiles = getUserQuartiles(
            newUserForecast,
            newWeights
          );

          return {
            ...prevChoice,
            userQuartiles: newUserQuartiles,
            userForecast: newUserForecast,
            userWeights: newWeights,
            isDirty: true,
          };
        }

        return prevChoice;
      })
    );
  }, []);

  const handleResetForecasts = useCallback(() => {
    setGroupOptions((prev) =>
      prev.map((prevOption) => {
        if (!prevOption.resolution) {
          const prevForecast = prevForecastValuesMap[prevOption.id]?.forecast;
          const prevWeights = prevForecastValuesMap[prevOption.id]?.weights;

          return {
            ...prevOption,
            userQuartiles: getUserQuartiles(
              prevForecast,
              prevWeights,
              prevOption.question.open_lower_bound,
              prevOption.question.open_upper_bound
            ),
            userForecast: getSliderValue(prevForecast),
            userWeights: getWeightsValue(prevWeights),
            isDirty: false,
          };
        }

        return prevOption;
      })
    );
  }, [prevForecastValuesMap]);

  const handlePredictSubmit = useCallback(async () => {
    setSubmitErrors([]);

    if (!questionsToSubmit.length) {
      return;
    }

    setIsSubmitting(true);
    const response = await createForecasts(
      postId,
      questionsToSubmit.map(({ question, userForecast, userWeights }) => {
        return {
          questionId: question.id,
          forecastData: {
            continuousCdf: getNumericForecastDataset(
              userForecast,
              userWeights,
              question.open_lower_bound!,
              question.open_upper_bound!
            ).cdf,
            probabilityYesPerCategory: null,
            probabilityYes: null,
          },
          sliderValues: {
            forecast: userForecast,
            weights: userWeights,
          },
        };
      })
    );
    setGroupOptions((prev) =>
      prev.map((prevQuestion) => ({ ...prevQuestion, isDirty: false }))
    );
    setIsSubmitting(false);

    const errors: ErrorResponse[] = [];
    if (response && "errors" in response && !!response.errors) {
      for (const response_errors of response.errors) {
        errors.push(response_errors);
      }
    }
    if (errors.length) {
      setSubmitErrors(errors);
    }
  }, [postId, questionsToSubmit]);

  const userCdf: number[] | undefined =
    activeGroupOption &&
    getNumericForecastDataset(
      activeGroupOption?.userForecast,
      activeGroupOption?.userWeights,
      activeGroupOption?.question.open_lower_bound!,
      activeGroupOption?.question.open_upper_bound!
    ).cdf;
  const communityCdf: number[] | undefined =
    activeGroupOption?.question.aggregations.recency_weighted.latest
      .forecast_values;

  return (
    <>
      <GroupForecastTable
        value={activeTableOption}
        options={groupOptions}
        onChange={setActiveTableOption}
      />
      {groupOptions.map((option) => {
        const dataset = getNumericForecastDataset(
          option.userForecast,
          option.userWeights,
          option.question.open_lower_bound!,
          option.question.open_upper_bound!
        );

        return (
          <div
            key={option.id}
            className={classNames(
              "mt-3",
              option.id !== activeTableOption && "hidden"
            )}
          >
            <ContinuousSlider
              question={option.question}
              forecast={option.userForecast}
              weights={option.userWeights}
              dataset={dataset}
              onChange={(forecast, weight) =>
                handleChange(option.id, forecast, weight)
              }
              disabled={!canPredict}
            />
          </div>
        );
      })}
      {!!activeGroupOption && !activeGroupOption?.resolution && (
        <div className="my-5 flex flex-wrap items-center justify-center gap-3 px-4">
          {canPredict &&
            (user ? (
              <>
                <Button
                  variant="secondary"
                  type="reset"
                  onClick={() => handleAddComponent(activeGroupOption.id)}
                >
                  {t("addComponentButton")}
                </Button>
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
            ))}
        </div>
      )}
      {!!activeGroupOption && (
        <>
          <NumericForecastTable
            question={activeGroupOption.question}
            userBounds={
              userCdf && {
                belowLower: userCdf[0],
                aboveUpper: 1 - userCdf[userCdf.length - 1],
              }
            }
            userQuartiles={activeGroupOption.userQuartiles ?? undefined}
            communityBounds={
              communityCdf && {
                belowLower: communityCdf[0],
                aboveUpper: 1 - communityCdf[communityCdf.length - 1],
              }
            }
            communityQuartiles={activeGroupOption.communityQuartiles}
            withUserQuartiles={activeGroupOption.resolution === null}
            isDirty={activeGroupOption.isDirty}
            hasUserForecast={
              !!prevForecastValuesMap[activeTableOption!].forecast
            }
          />

          {!!activeGroupOption.resolution && (
            <div className="mb-3 text-gray-600 dark:text-gray-600-dark">
              <p className="my-1 flex justify-center gap-1 text-base">
                {t("resolutionDescriptionContinuous")}
                <strong className="text-purple-800 dark:text-purple-800-dark">
                  {formatResolution(
                    activeGroupOption.resolution,
                    activeGroupOption.question.type,
                    locale
                  )}
                </strong>
              </p>
            </div>
          )}
        </>
      )}
      {submitErrors.map((errResponse, index) => (
        <FormErrorMessage key={`error-${index}`} errors={errResponse} />
      ))}
    </>
  );
};

function generateGroupOptions(
  questions: QuestionWithNumericForecasts[],
  prevForecastValuesMap: Record<
    number,
    {
      forecast?: MultiSliderValue[];
      weights?: number[];
    }
  >,
  permission?: ProjectPermissions
): ConditionalTableOption[] {
  return [...questions]
    .sort((a, b) =>
      differenceInMilliseconds(
        new Date(a.scheduled_resolve_time),
        new Date(b.scheduled_resolve_time)
      )
    )
    .map((q) => {
      const prevForecast = prevForecastValuesMap[q.id]?.forecast;
      const prevWeights = prevForecastValuesMap[q.id]?.weights;

      return {
        id: q.id,
        name: extractQuestionGroupName(q.title),
        question: q,
        userQuartiles: getUserQuartiles(
          prevForecast,
          prevWeights,
          q.open_lower_bound,
          q.open_upper_bound
        ),
        userForecast: getSliderValue(prevForecast),
        userWeights: getWeightsValue(prevWeights),
        communityQuartiles: computeQuartilesFromCDF(q.forecasts.latest_cdf),
        resolution: q.resolution,
        isDirty: false,
        menu: (
          <ForecastMakerGroupControls
            question={q}
            permission={permission}
            button={
              <Button className="h-8 w-8" variant="link">
                <FontAwesomeIcon icon={faEllipsis}></FontAwesomeIcon>
              </Button>
            }
          />
        ),
      };
    });
}

function getUserQuartiles(
  forecast?: MultiSliderValue[],
  weight?: number[],
  openLower?: boolean,
  openUpper?: boolean
) {
  if (
    !forecast ||
    !weight ||
    typeof openLower === "undefined" ||
    typeof openUpper === "undefined"
  ) {
    return null;
  }

  const dataset = getNumericForecastDataset(
    forecast,
    weight,
    openLower,
    openUpper
  );
  return computeQuartilesFromCDF(dataset.cdf);
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

export default ForecastMakerGroupContinuous;
