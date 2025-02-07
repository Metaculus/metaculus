"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { differenceInMilliseconds } from "date-fns";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useCallback, useMemo, useState } from "react";

import { createForecasts } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
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
import PredictButton from "../predict_button";

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
    generateGroupOptions(questions, prevForecastValuesMap, permission, post)
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

  const handleResetForecasts = useCallback(
    (questionId?: number) => {
      setGroupOptions((prev) =>
        prev.map((prevOption) => {
          if (
            (questionId && prevOption.id === questionId) ||
            (!questionId && !prevOption.resolution)
          ) {
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
    },
    [prevForecastValuesMap]
  );

  const handleSingleQuestionSubmit = useCallback(
    async (questionId: number) => {
      const optionToSubmit = questionsToSubmit.find(
        (opt) => opt.id === questionId
      );

      if (!optionToSubmit) return;

      setIsSubmitting(true);
      const response = await createForecasts(postId, [
        {
          questionId: optionToSubmit.question.id,
          forecastData: {
            continuousCdf: getNumericForecastDataset(
              getNormalizedContinuousForecast(optionToSubmit.userForecast),
              optionToSubmit.question.open_lower_bound,
              optionToSubmit.question.open_upper_bound
            ).cdf,
            probabilityYesPerCategory: null,
            probabilityYes: null,
          },
          distributionInput: {
            type: "slider",
            components: getNormalizedContinuousForecast(
              optionToSubmit.userForecast
            ),
          },
        },
      ]);

      setGroupOptions((prev) =>
        prev.map((opt) =>
          opt.id === questionId ? { ...opt, isDirty: false } : opt
        )
      );
      setIsSubmitting(false);
      return response;
    },
    [postId, questionsToSubmit]
  );

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

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
      setIsSubmitting(false);
      return;
    }
    setGroupOptions((prev) =>
      prev.map((prevQuestion) => ({ ...prevQuestion, isDirty: false }))
    );
    setIsSubmitting(false);
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
        subQuestionId={subQuestionId}
        handleChange={handleChange}
        handleAddComponent={handleAddComponent}
        handleResetForecasts={handleResetForecasts}
        handlePredictSubmit={handleSingleQuestionSubmit}
      />
      {!!questionsToSubmit.some((opt) => opt.isDirty) && (
        <div className="flex justify-center gap-3">
          <Button
            variant="secondary"
            type="reset"
            onClick={() => handleResetForecasts()}
          >
            {t("discardChangesButton")}
          </Button>

          <PredictButton
            onSubmit={() => handlePredictSubmit()}
            isDirty={true}
            hasUserForecast={true}
            isPending={isSubmitting}
          />
        </div>
      )}

      <FormError
        errors={submitError}
        className="mt-2 flex items-center justify-center"
        detached
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
