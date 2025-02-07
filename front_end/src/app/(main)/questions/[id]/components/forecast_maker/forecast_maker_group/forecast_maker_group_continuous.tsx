"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { differenceInMilliseconds } from "date-fns";
import { useSearchParams } from "next/navigation";
import React, {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { ErrorResponse } from "@/types/fetch";
import {
  Post,
  PostWithForecasts,
  ProjectPermissions,
  QuestionStatus,
} from "@/types/post";
import {
  DistributionSliderComponent,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  extractPrevNumericForecastValue,
  getNormalizedContinuousForecast,
  getNumericForecastDataset,
  getUserContinuousQuartiles,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

import ForecastMakerGroupControls from "./forecast_maker_group_menu";
import { SLUG_POST_SUB_QUESTION_ID } from "../../../search_params";
import GroupForecastAccordion from "../continuous_group_accordion/group_forecast_accordion";
import { ConditionalTableOption } from "../group_forecast_table";

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
  const params = useSearchParams();
  const subQuestionId = Number(params.get(SLUG_POST_SUB_QUESTION_ID));
  const { id: postId, user_permission: permission } = post;

  const prevForecastValuesMap = useMemo(
    () =>
      questions.reduce<
        Record<number, DistributionSliderComponent[] | undefined>
      >((acc, question) => {
        const latest = question.my_forecasts?.latest;
        return {
          ...acc,
          [question.id]: extractPrevNumericForecastValue(
            latest && !latest.end_time ? latest.distribution_input : undefined
          )?.components,
        };
      }, {}),
    [questions]
  );

  const [groupOptions, setGroupOptions] = useState<ConditionalTableOption[]>(
    generateGroupOptions(questions, prevForecastValuesMap, undefined, post)
  );

  useEffect(() => {
    setGroupOptions(
      generateGroupOptions(questions, prevForecastValuesMap, permission, post)
    );
  }, [permission, prevForecastValuesMap, questions, post]);
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

  const handleChange = useCallback(
    (optionId: number, components: DistributionSliderComponent[]) => {
      setGroupOptions((prev) =>
        prev.map((option) => {
          if (option.id === optionId) {
            return {
              ...option,
              userQuartiles: getUserContinuousQuartiles(
                components,
                option.question.open_lower_bound,
                option.question.open_upper_bound
              ),
              userForecast: components,
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
            { left: 0.4, center: 0.5, right: 0.6, weight: 1 },
          ];
          const newUserQuartiles = getUserContinuousQuartiles(newUserForecast);

          return {
            ...prevChoice,
            userQuartiles: newUserQuartiles,
            userForecast: newUserForecast,
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
          const prevForecast = prevForecastValuesMap[prevOption.id];

          return {
            ...prevOption,
            userQuartiles: getUserContinuousQuartiles(
              prevForecast,
              prevOption.question.open_lower_bound,
              prevOption.question.open_upper_bound
            ),
            userForecast: getSliderValue(prevForecast),
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
      questionsToSubmit.map(({ question, userForecast }) => {
        return {
          questionId: question.id,
          forecastData: {
            continuousCdf: getNumericForecastDataset(
              getNormalizedContinuousForecast(userForecast),
              question.open_lower_bound,
              question.open_upper_bound
            ).cdf,
            probabilityYesPerCategory: null,
            probabilityYes: null,
          },
          distributionInput: {
            type: "slider",
            components: getNormalizedContinuousForecast(userForecast),
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

  return (
    <>
      {predictionMessage && (
        <div className="mb-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {predictionMessage}
        </div>
      )}
      <GroupForecastAccordion
        options={groupOptions}
        groupVariable={groupVariable}
        canPredict={canPredict}
        isPending={isSubmitting}
        submitError={submitError}
        subQuestionId={subQuestionId}
        handleChange={handleChange}
        handleAddComponent={handleAddComponent}
        handleResetForecasts={handleResetForecasts}
        handlePredictSubmit={handlePredictSubmit}
      />
    </>
  );
};

function generateGroupOptions(
  questions: QuestionWithNumericForecasts[],
  prevForecastValuesMap: Record<
    number,
    DistributionSliderComponent[] | undefined
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
      const prevForecast = prevForecastValuesMap[q.id];

      return {
        id: q.id,
        name: q.label,
        question: q,
        userQuartiles: getUserContinuousQuartiles(
          prevForecast,
          q.open_lower_bound,
          q.open_upper_bound
        ),
        userForecast: getSliderValue(prevForecast),
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

function getSliderValue(components?: DistributionSliderComponent[]) {
  return components ?? null;
}

export default ForecastMakerGroupContinuous;
