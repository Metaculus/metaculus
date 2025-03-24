"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { FormError } from "@/components/ui/form_field";
import { ContinuousForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import {
  Post,
  PostWithForecasts,
  ProjectPermissions,
  QuestionStatus,
} from "@/types/post";
import {
  DefaultInboundOutcomeCount,
  DistributionQuantile,
  DistributionSlider,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  clearQuantileComponents,
  extractPrevNumericForecastValue,
  getInitialQuantileDistributionComponents,
  getInitialSliderDistributionComponents,
  getNormalizedContinuousForecast,
  getQuantileNumericForecastDataset,
  getQuantilesDistributionFromSlider,
  getSliderDistributionFromQuantiles,
  getSliderNumericForecastDataset,
  getUserContinuousQuartiles,
  isAllQuantileComponentsDirty,
} from "@/utils/forecasts";
import { computeQuartilesFromCDF } from "@/utils/math";

import ForecastMakerGroupControls from "./forecast_maker_group_menu";
import { SLUG_POST_SUB_QUESTION_ID } from "../../../search_params";
import GroupForecastAccordion, {
  ContinuousGroupOption,
} from "../continuous_group_accordion/group_forecast_accordion";
import { validateUserQuantileData } from "../helpers";
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
        Record<number, DistributionSlider | DistributionQuantile | undefined>
      >((acc, question) => {
        const latest = question.my_forecasts?.latest;
        return {
          ...acc,
          [question.id]: extractPrevNumericForecastValue(
            latest && !latest.end_time ? latest.distribution_input : undefined
          ),
        };
      }, {}),
    [questions]
  );
  const [groupOptions, setGroupOptions] = useState<ContinuousGroupOption[]>(
    generateGroupOptions(questions, prevForecastValuesMap, permission, post)
  );

  // ensure options have the latest forecast data
  useEffect(() => {
    const newGroupOptions = generateGroupOptions(
      questions,
      prevForecastValuesMap,
      permission,
      post
    );
    setGroupOptions((prev) =>
      prev.map((o) => {
        const newOption = newGroupOptions.find((q) => q.id === o.question.id);
        return {
          ...o,
          resolution: newOption?.resolution ?? o.resolution,
          menu: newOption?.menu ?? o.menu,
          question: newOption?.question ?? o.question,
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const questionsToSubmit = useMemo(
    () =>
      groupOptions.filter(
        (option) =>
          option.question.status === QuestionStatus.OPEN &&
          (option.isDirty || option.hasUserForecast)
      ),
    [groupOptions]
  );

  const handleChange = useCallback(
    (
      optionId: number,
      distribution: DistributionSlider | DistributionQuantile
    ) => {
      const { components, type: forecastInputMode } = distribution;
      setGroupOptions((prev) =>
        prev.map((option) => {
          if (option.id === optionId) {
            return {
              ...option,
              forecastInputMode: forecastInputMode,
              ...(forecastInputMode === ContinuousForecastInputType.Slider
                ? {
                    userSliderForecast: components,
                    userQuartiles: getUserContinuousQuartiles(
                      components,
                      option.question
                    ),
                  }
                : { userQuantileForecast: components }),
              isDirty:
                forecastInputMode === ContinuousForecastInputType.Slider
                  ? true
                  : isAllQuantileComponentsDirty(components),
            };
          }

          return option;
        })
      );
    },
    []
  );

  const handleCopy = useCallback(
    (fromOptionId: number, toOptionId: number) => {
      const fromOption = groupOptions.find((obj) => obj.id === fromOptionId);

      if (!fromOption) return;

      const { userSliderForecast, userQuantileForecast, forecastInputMode } =
        fromOption;

      handleChange(
        toOptionId,
        forecastInputMode === ContinuousForecastInputType.Slider
          ? {
              type: ContinuousForecastInputType.Slider,
              components: userSliderForecast,
            }
          : {
              type: ContinuousForecastInputType.Quantile,
              components: userQuantileForecast,
            }
      );
    },
    [groupOptions, handleChange]
  );

  const handleForecastInputModeChange = useCallback(
    (optionId: number, mode: ContinuousForecastInputType) => {
      setGroupOptions((prev) =>
        prev.map((prevChoice) => {
          if (prevChoice.id === optionId) {
            return {
              ...prevChoice,
              forecastInputMode: mode,
              isDirty: prevChoice.isDirty,
            };
          }

          return prevChoice;
        })
      );
    },
    []
  );

  const handleAddComponent = useCallback((option: ContinuousGroupOption) => {
    setGroupOptions((prev) =>
      prev.map((prevChoice) => {
        if (prevChoice.id === option.id) {
          const newUserForecast = [
            ...getNormalizedContinuousForecast(prevChoice.userSliderForecast),
            { left: 0.4, center: 0.5, right: 0.6, weight: 1 },
          ];
          const newUserQuartiles = getUserContinuousQuartiles(
            newUserForecast,
            option.question
          );

          return {
            ...prevChoice,
            userQuartiles: newUserQuartiles,
            userSliderForecast: newUserForecast,
            isDirty: true,
          };
        }

        return prevChoice;
      })
    );
  }, []);

  const handleResetForecasts = useCallback(
    (option?: ContinuousGroupOption) => {
      setGroupOptions((prev) =>
        prev.map((prevOption) => {
          if (
            (option && prevOption.id === option.id) ||
            (!option && !prevOption.resolution)
          ) {
            const prevForecast = prevForecastValuesMap[prevOption.id];
            const userSliderForecast = getInitialSliderDistributionComponents(
              prevOption.question.my_forecasts?.latest,
              prevForecast,
              prevOption.question
            );
            return {
              ...prevOption,
              forecastInputMode:
                prevForecast?.type ?? prevOption.forecastInputMode,
              userQuartiles: getUserContinuousQuartiles(
                userSliderForecast,
                prevOption.question
              ),
              userSliderForecast,
              userQuantileForecast: getInitialQuantileDistributionComponents(
                prevOption.question.my_forecasts?.latest,
                prevForecast,
                prevOption.question
              ),
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
            continuousCdf:
              optionToSubmit.forecastInputMode ===
              ContinuousForecastInputType.Quantile
                ? getQuantileNumericForecastDataset(
                    optionToSubmit.userQuantileForecast,
                    optionToSubmit.question
                  ).cdf
                : getSliderNumericForecastDataset(
                    getNormalizedContinuousForecast(
                      optionToSubmit.userSliderForecast
                    ),
                    optionToSubmit.question.open_lower_bound,
                    optionToSubmit.question.open_upper_bound,
                    optionToSubmit.question.inbound_outcome_count ??
                      DefaultInboundOutcomeCount
                  ).cdf,
            probabilityYesPerCategory: null,
            probabilityYes: null,
          },
          distributionInput:
            optionToSubmit.forecastInputMode ===
            ContinuousForecastInputType.Slider
              ? {
                  type: ContinuousForecastInputType.Slider,
                  components: getNormalizedContinuousForecast(
                    optionToSubmit.userSliderForecast
                  ),
                }
              : {
                  type: ContinuousForecastInputType.Quantile,
                  components: clearQuantileComponents(
                    optionToSubmit.userQuantileForecast
                  ),
                },
        },
      ]);

      // update inactive forecast tab with new forecast data
      setGroupOptions((prev) =>
        prev.map((opt) => {
          if (opt.id === questionId) {
            return updateGroupOptions(opt);
          }
          return opt;
        })
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
    // validate table forecast before submission
    for (const option of questionsToSubmit) {
      if (option.forecastInputMode === ContinuousForecastInputType.Quantile) {
        const subquestionErrors = validateUserQuantileData({
          question: option.question,
          components: option.userQuantileForecast,
          cdf: getQuantileNumericForecastDataset(
            option.userQuantileForecast,
            option.question
          ).cdf,
          t,
        });
        if (subquestionErrors.length) {
          setSubmitError(new Error(subquestionErrors[0]));
          setIsSubmitting(false);
          return;
        }
      }
    }

    const response = await createForecasts(
      postId,
      questionsToSubmit.map(
        ({
          question,
          userSliderForecast,
          userQuantileForecast,
          forecastInputMode,
        }) => {
          return {
            questionId: question.id,
            forecastData: {
              continuousCdf:
                forecastInputMode === ContinuousForecastInputType.Quantile
                  ? getQuantileNumericForecastDataset(
                      userQuantileForecast,
                      question
                    ).cdf
                  : getSliderNumericForecastDataset(
                      getNormalizedContinuousForecast(userSliderForecast),
                      question.open_lower_bound,
                      question.open_upper_bound,
                      question.inbound_outcome_count ??
                        DefaultInboundOutcomeCount
                    ).cdf,
              probabilityYesPerCategory: null,
              probabilityYes: null,
            },
            distributionInput:
              forecastInputMode === ContinuousForecastInputType.Slider
                ? {
                    type: forecastInputMode,
                    components:
                      getNormalizedContinuousForecast(userSliderForecast),
                  }
                : {
                    type: ContinuousForecastInputType.Quantile,
                    components: clearQuantileComponents(userQuantileForecast),
                  },
          };
        }
      )
    );

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
      setIsSubmitting(false);
      return;
    }

    // update inactive forecast tab with new forecast data
    setGroupOptions((prev) =>
      prev.map((prevQuestion) => {
        return questionsToSubmit.some((q) => q.id === prevQuestion.id)
          ? updateGroupOptions(prevQuestion)
          : prevQuestion;
      })
    );
    setIsSubmitting(false);
  }, [postId, questionsToSubmit, t]);

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
        handleForecastInputModeChange={handleForecastInputModeChange}
        handleCopy={handleCopy}
      />
      {questionsToSubmit.some((opt) => opt.isDirty) && (
        <div className="mb-2 mt-4 flex justify-center gap-3">
          <Button
            variant="secondary"
            type="reset"
            onClick={() => handleResetForecasts()}
          >
            {t("discardAllChangesButton")}
          </Button>

          <PredictButton
            onSubmit={() => handlePredictSubmit()}
            isDirty={true}
            hasUserForecast={true}
            isPending={isSubmitting}
            predictLabel={t("saveAllChanges")}
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
    DistributionSlider | DistributionQuantile | undefined
  >,
  permission?: ProjectPermissions,
  post?: Post
): ContinuousGroupOption[] {
  return [...questions].map((q) => {
    const prevForecast = prevForecastValuesMap[q.id];
    const userSliderForecast = getInitialSliderDistributionComponents(
      q.my_forecasts?.latest,
      prevForecast,
      q
    );
    return {
      id: q.id,
      name: q.label,
      question: q,
      userQuartiles: getUserContinuousQuartiles(userSliderForecast, q),
      userSliderForecast,
      userQuantileForecast: getInitialQuantileDistributionComponents(
        q.my_forecasts?.latest,
        prevForecast,
        q
      ),
      forecastInputMode:
        prevForecast?.type ?? ContinuousForecastInputType.Slider,
      communityQuartiles: q.aggregations.recency_weighted.latest
        ? computeQuartilesFromCDF(
            q.aggregations.recency_weighted.latest.forecast_values
          )
        : null,
      resolution: q.resolution,
      isDirty: false,
      hasUserForecast: !isNil(prevForecast),
      menu: (
        <ForecastMakerGroupControls
          question={q}
          permission={permission}
          button={
            <Button
              className="size-[26px] border border-blue-400 dark:border-blue-400-dark"
              variant="link"
            >
              <FontAwesomeIcon
                className="text-blue-700 dark:text-blue-700-dark"
                icon={faEllipsis}
              ></FontAwesomeIcon>
            </Button>
          }
          post={post}
        />
      ),
    };
  });
}

function updateGroupOptions(groupOption: ContinuousGroupOption) {
  const userSliderForecast =
    groupOption.forecastInputMode === ContinuousForecastInputType.Slider
      ? groupOption.userSliderForecast
      : getSliderDistributionFromQuantiles(
          groupOption.userQuantileForecast,
          groupOption.question
        );
  const userQuantileForecast =
    groupOption.forecastInputMode === ContinuousForecastInputType.Quantile
      ? groupOption.userQuantileForecast.map((q) => ({
          ...q,
          isDirty: false,
        }))
      : getQuantilesDistributionFromSlider(
          groupOption.userSliderForecast,
          groupOption.question
        );
  const userQuartiles = getUserContinuousQuartiles(
    userSliderForecast,
    groupOption.question
  );
  return {
    ...groupOption,
    userSliderForecast,
    userQuantileForecast,
    userQuartiles,
    isDirty: false,
    hasUserForecast: true,
  };
}

export default ForecastMakerGroupContinuous;
