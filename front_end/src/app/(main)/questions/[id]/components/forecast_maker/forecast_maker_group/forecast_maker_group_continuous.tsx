"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { differenceInMilliseconds } from "date-fns";
import { isNil } from "lodash";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import { MultiSliderValue } from "@/components/sliders/multi_slider";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { ErrorResponse } from "@/types/fetch";
import {
  Post,
  PostWithForecasts,
  ProjectPermissions,
  QuestionStatus,
} from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getCdfBounds } from "@/utils/charts";
import cn from "@/utils/cn";
import {
  extractPrevNumericForecastValue,
  getNormalizedContinuousForecast,
  getNormalizedContinuousWeight,
  getNumericForecastDataset,
  getUserContinuousQuartiles,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";
import {
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
  groupVariable: string;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage: ReactNode;
};

const ForecastMakerGroupContinuous: FC<Props> = ({
  post,
  questions,
  canPredict,
  groupVariable,
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
      >((acc, question) => {
        const latest = question.my_forecasts?.latest;
        return {
          ...acc,
          [question.id]: extractPrevNumericForecastValue(
            latest && !latest.end_time ? latest.slider_values : undefined
          ),
        };
      }, {}),
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
  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const questionsToSubmit = useMemo(
    () =>
      groupOptions.filter(
        (option) =>
          option.userForecast !== null &&
          option.question.status === QuestionStatus.OPEN
      ),
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
              userQuartiles: getUserContinuousQuartiles(
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
            ...getNormalizedContinuousForecast(prevChoice.userForecast),
            { left: 0.4, center: 0.5, right: 0.6 },
          ];
          const newWeights = [...prevChoice.userWeights, 1];
          const newUserQuartiles = getUserContinuousQuartiles(
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
            userQuartiles: getUserContinuousQuartiles(
              prevForecast,
              prevWeights,
              prevOption.question.open_lower_bound,
              prevOption.question.open_upper_bound
            ),
            userForecast: getSliderValue(prevForecast),
            userWeights: getNormalizedContinuousWeight(prevWeights),
            isDirty: false,
          };
        }

        return prevOption;
      })
    );
  }, [prevForecastValuesMap]);

  const handlePredictSubmit = useCallback(async () => {
    setSubmitError(undefined);

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
              getNormalizedContinuousForecast(userForecast),
              userWeights,
              question.open_lower_bound,
              question.open_upper_bound
            ).cdf,
            probabilityYesPerCategory: null,
            probabilityYes: null,
          },
          sliderValues: {
            forecast: getNormalizedContinuousForecast(userForecast),
            weights: userWeights,
          },
        };
      })
    );
    setGroupOptions((prev) =>
      prev.map((prevQuestion) => ({ ...prevQuestion, isDirty: false }))
    );
    setIsSubmitting(false);

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
  }, [postId, questionsToSubmit]);

  const previousForecast = activeGroupOption?.question.my_forecasts?.latest;
  const [overlayPreviousForecast, setOverlayPreviousForecast] =
    useState<boolean>(
      !!previousForecast?.forecast_values && !previousForecast.slider_values
    );

  const userCdf: number[] | undefined =
    activeGroupOption &&
    getNumericForecastDataset(
      getNormalizedContinuousForecast(activeGroupOption.userForecast),
      activeGroupOption?.userWeights,
      activeGroupOption?.question.open_lower_bound,
      activeGroupOption?.question.open_upper_bound
    ).cdf;
  const userPreviousCdf: number[] | undefined =
    overlayPreviousForecast && previousForecast
      ? previousForecast.forecast_values
      : undefined;
  const communityCdf: number[] | undefined =
    activeGroupOption?.question.aggregations.recency_weighted.latest
      ?.forecast_values;

  return (
    <>
      <GroupForecastTable
        value={activeTableOption}
        options={groupOptions}
        groupVariable={groupVariable}
        onChange={setActiveTableOption}
        questions={questions}
        showCP={!user || !hideCP}
      />
      {groupOptions.map((option) => {
        const normalizedUserForecast = getNormalizedContinuousForecast(
          option.userForecast
        );

        const dataset = getNumericForecastDataset(
          normalizedUserForecast,
          option.userWeights,
          option.question.open_lower_bound,
          option.question.open_upper_bound
        );

        return (
          <div
            key={option.id}
            className={cn("mt-3", option.id !== activeTableOption && "hidden")}
          >
            <ContinuousSlider
              question={option.question}
              forecast={normalizedUserForecast}
              overlayPreviousForecast={overlayPreviousForecast}
              setOverlayPreviousForecast={setOverlayPreviousForecast}
              weights={option.userWeights}
              dataset={dataset}
              onChange={(forecast, weight) =>
                handleChange(option.id, forecast, weight)
              }
              disabled={
                !canPredict || option.question.status !== QuestionStatus.OPEN
              }
            />
          </div>
        );
      })}
      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {predictionMessage}
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
      <FormError
        errors={submitError}
        className="mt-2 flex items-center justify-center"
        detached
      />
      {activeGroupOptionPredictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {t(activeGroupOptionPredictionMessage)}
        </div>
      )}
      {!!activeGroupOption && (
        <>
          <NumericForecastTable
            question={activeGroupOption.question}
            userBounds={getCdfBounds(userCdf)}
            userQuartiles={activeGroupOption.userQuartiles ?? undefined}
            userPreviousBounds={getCdfBounds(userPreviousCdf)}
            userPreviousQuartiles={
              userPreviousCdf
                ? computeQuartilesFromCDF(userPreviousCdf)
                : undefined
            }
            communityBounds={getCdfBounds(communityCdf)}
            communityQuartiles={
              activeGroupOption.communityQuartiles ?? undefined
            }
            withUserQuartiles={activeGroupOption.resolution === null}
            withCommunityQuartiles={!user || !hideCP}
            isDirty={activeGroupOption.isDirty}
            hasUserForecast={
              !isNil(activeTableOption) &&
              !!prevForecastValuesMap[activeTableOption]?.forecast
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
        name: q.label,
        question: q,
        userQuartiles: getUserContinuousQuartiles(
          prevForecast,
          prevWeights,
          q.open_lower_bound,
          q.open_upper_bound
        ),
        userForecast: getSliderValue(prevForecast),
        userWeights: getNormalizedContinuousWeight(prevWeights),
        communityQuartiles: q.aggregations.recency_weighted.latest
          ? computeQuartilesFromCDF(
              q.aggregations.recency_weighted.latest.forecast_values
            )
          : null,
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

function getSliderValue(forecast?: MultiSliderValue[]) {
  return forecast ?? null;
}

export default ForecastMakerGroupContinuous;
