"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { differenceInMilliseconds } from "date-fns";
import { isNil } from "lodash";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { ErrorResponse } from "@/types/fetch";
import {
  Post,
  PostWithForecasts,
  ProjectPermissions,
  QuestionStatus,
} from "@/types/post";
import {
  PredictionInputMessage,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  extractPrevNumericForecastValue,
  getNumericForecastDataset,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";
import {
  extractQuestionGroupName,
  formatResolution,
  getSubquestionPredictionInputMessage,
} from "@/utils/questions";

import ForecastMakerGroupControls from "./forecast_maker_group_menu";
import { SLUG_POST_SUB_QUESTION_ID } from "../../../search_params";
import { useHideCP } from "../../cp_provider";
import ContinuousSlider from "../continuous_slider";
import GroupForecastTable, {
  ConditionalTableOption,
} from "../group_forecast_table";
import NumericForecastTable from "../numeric_table";
import PredictButton from "../predict_button";
import ScoreDisplay from "../resolution/score_display";

type Props = {
  post: PostWithForecasts;
  questions: QuestionWithNumericForecasts[];
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage: PredictionInputMessage;
};

const ForecastMakerGroupContinuous: FC<Props> = ({
  post,
  questions,
  canPredict,
  canResolve,
  predictionMessage,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const params = useSearchParams();
  const subQuestionId = Number(params.get(SLUG_POST_SUB_QUESTION_ID));

  const { id: postId, user_permission: permission } = post;

  const prevForecastValuesMap = useMemo(
    () =>
      questions.reduce<
        Record<number, { forecast?: MultiSliderValue[]; weights?: number[] }>
      >(
        (acc, question) => ({
          ...acc,
          [question.id]: extractPrevNumericForecastValue(
            question.my_forecasts?.latest?.slider_values
          ),
        }),
        {}
      ),
    [questions]
  );
  const hasUserForecast = useMemo(() => {
    const forecastsByQuestions = Object.values(prevForecastValuesMap);

    return (
      !!forecastsByQuestions.length &&
      forecastsByQuestions.some((v) => !isNil(v.forecast))
    );
  }, [prevForecastValuesMap]);

  const [groupOptions, setGroupOptions] = useState<ConditionalTableOption[]>(
    generateGroupOptions(questions, prevForecastValuesMap, undefined, post)
  );

  useEffect(() => {
    setGroupOptions(
      generateGroupOptions(questions, prevForecastValuesMap, permission, post)
    );
  }, [permission, prevForecastValuesMap, questions]);
  const [activeTableOption, setActiveTableOption] = useState(
    (subQuestionId || groupOptions.at(0)?.id) ?? null
  );
  const activeGroupOption = useMemo(
    () => groupOptions.find((o) => o.id === activeTableOption),
    [groupOptions, activeTableOption]
  );
  const activeQuestion = useMemo(
    () => questions.find((q) => q.id === activeTableOption),
    [questions, activeTableOption]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse[]>([]);
  const questionsToSubmit = useMemo(
    () => groupOptions.filter((option) => option.userForecast !== null),
    [groupOptions]
  );
  const isPickerDirty = useMemo(
    () => groupOptions.some((option) => option.isDirty),
    [groupOptions]
  );
  const activeGroupOptionPredictionMessage = useMemo(
    () =>
      activeGroupOption
        ? getSubquestionPredictionInputMessage(activeGroupOption)
        : null,
    [activeGroupOption]
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
            ...getNormalizedUserForecast(prevChoice.userForecast),
            { left: 0.4, center: 0.5, right: 0.6 },
          ];
          const newWeights = [...prevChoice.userWeights, 1];
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
              getNormalizedUserForecast(userForecast),
              userWeights,
              question.open_lower_bound!,
              question.open_upper_bound!
            ).cdf,
            probabilityYesPerCategory: null,
            probabilityYes: null,
          },
          sliderValues: {
            forecast: getNormalizedUserForecast(userForecast),
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
      getNormalizedUserForecast(activeGroupOption.userForecast),
      activeGroupOption?.userWeights,
      activeGroupOption?.question.open_lower_bound!,
      activeGroupOption?.question.open_upper_bound!
    ).cdf;
  const communityCdf: number[] | undefined =
    activeGroupOption?.question.aggregations.recency_weighted.latest
      ?.forecast_values;

  return (
    <>
      <GroupForecastTable
        value={activeTableOption}
        options={groupOptions}
        onChange={setActiveTableOption}
        questions={questions}
        showCP={!user || !hideCP}
      />
      {groupOptions.map((option) => {
        const normalizedUserForecast = getNormalizedUserForecast(
          option.userForecast
        );

        const dataset = getNumericForecastDataset(
          normalizedUserForecast,
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
              forecast={normalizedUserForecast}
              weights={option.userWeights}
              dataset={dataset}
              onChange={(forecast, weight) =>
                handleChange(option.id, forecast, weight)
              }
              disabled={
                !canPredict || option.question.status != QuestionStatus.OPEN
              }
            />
          </div>
        );
      })}
      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {t(predictionMessage)}
        </div>
      )}
      {!!activeGroupOption &&
        activeGroupOption.question.status == QuestionStatus.OPEN && (
          <div className="my-5 flex flex-wrap items-center justify-center gap-3 px-4">
            {canPredict && (
              <>
                {!!user && (
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
        )}
      {submitErrors.map((errResponse, index) => (
        <FormErrorMessage
          className="mb-2 flex justify-center"
          key={`error-${index}`}
          errors={errResponse}
        />
      ))}
      {activeGroupOptionPredictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {t(activeGroupOptionPredictionMessage)}
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
            withCommunityQuartiles={!user || !hideCP}
            isDirty={activeGroupOption.isDirty}
            hasUserForecast={
              !!prevForecastValuesMap[activeTableOption!].forecast
            }
          />

          {!!activeGroupOption.resolution && (
            <div className="mb-3 text-gray-600 dark:text-gray-600-dark">
              <p className="my-1 flex justify-center gap-1 text-base">
                {t("resolutionDescriptionContinuous")}
                <strong
                  className="text-purple-800 dark:text-purple-800-dark"
                  suppressHydrationWarning
                >
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
      {activeQuestion && <ScoreDisplay question={activeQuestion} />}
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
  permission?: ProjectPermissions,
  post?: Post
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
        communityQuartiles: computeQuartilesFromCDF(
          q.aggregations.recency_weighted.latest
            ? q.aggregations.recency_weighted.latest.forecast_values
            : []
        ),
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
            post={post}
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
  return forecast ?? null;
}

function getNormalizedUserForecast(forecast: MultiSliderValue[] | null) {
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
