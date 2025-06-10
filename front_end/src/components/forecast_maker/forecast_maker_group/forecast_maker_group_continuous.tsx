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
  useRef,
  useState,
} from "react";

import { SLUG_POST_SUB_QUESTION_ID } from "@/app/(main)/questions/[id]/search_params";
import {
  createForecasts,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { ContinuousForecastInputType } from "@/types/charts";
import { ErrorResponse } from "@/types/fetch";
import {
  Post,
  PostWithForecasts,
  ProjectPermissions,
  QuestionStatus,
} from "@/types/post";
import {
  DistributionQuantile,
  DistributionSlider,
  QuestionWithNumericForecasts,
  UserForecast,
} from "@/types/question";
import {
  getQuantileNumericForecastDataset,
  getSliderNumericForecastDataset,
} from "@/utils/forecasts/dataset";
import {
  clearQuantileComponents,
  getNormalizedContinuousForecast,
  getUserContinuousQuartiles,
  isAllQuantileComponentsDirty,
  isOpenQuestionPredicted,
} from "@/utils/forecasts/helpers";
import {
  extractPrevNumericForecastValue,
  getInitialQuantileDistributionComponents,
  getInitialSliderDistributionComponents,
} from "@/utils/forecasts/initial_values";
import {
  getQuantilesDistributionFromSlider,
  getSliderDistributionFromQuantiles,
} from "@/utils/forecasts/switch_forecast_type";
import { computeQuartilesFromCDF } from "@/utils/math";
import { canWithdrawForecast } from "@/utils/questions/predictions";

import ForecastMakerGroupControls from "./forecast_maker_group_menu";
import GroupForecastAccordion, {
  ContinuousGroupOption,
} from "../continuous_group_accordion/group_forecast_accordion";
import WithdrawButton from "../withdraw/withdraw_button";
import {
  buildDefaultForecastExpiration,
  forecastExpirationToDate,
  ForecastExpirationValue,
  getTimeToExpireDays,
} from "../forecast_expiration";
import { validateUserQuantileData } from "../helpers";
import PredictButton from "../predict_button";

type Props = {
  post: PostWithForecasts;
  questions: QuestionWithNumericForecasts[];
  groupVariable: string;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage: ReactNode;
  onPredictionSubmit?: () => void;
};

const ForecastMakerGroupContinuous: FC<Props> = ({
  post,
  questions,
  canPredict,
  groupVariable,
  predictionMessage,
  onPredictionSubmit,
}) => {
  const t = useTranslations();
  const params = useSearchParams();
  const resetTarget = useRef<"all" | number | undefined>(undefined);
  const subQuestionId = Number(params.get(SLUG_POST_SUB_QUESTION_ID));
  const { id: postId, user_permission: permission } = post;
  const { user } = useAuth();
  const prevForecastValuesMap = useMemo(
    () =>
      questions.reduce<
        Record<number, DistributionSlider | DistributionQuantile | undefined>
      >((acc, question) => {
        const latest = question.my_forecasts?.latest;
        const isQPredicted = isOpenQuestionPredicted(question, {
          treatClosedAsPredicted: false,
        });
        const dist_input = isQPredicted
          ? latest?.distribution_input
          : undefined;
        return {
          ...acc,
          [question.id]: extractPrevNumericForecastValue(dist_input),
        };
      }, {}),
    [questions]
  );

  const soonToExpireForecastsCount = useMemo(() => {
    return questions.filter((q) => {
      const timeToExpireDays = getTimeToExpireDays(q.my_forecasts?.latest);
      return timeToExpireDays && timeToExpireDays > 0 && timeToExpireDays < 2;
    }).length;
  }, [questions]);

  const expiredForecastsCount = useMemo(() => {
    return questions.filter((q) => {
      const timeToExpireDays = getTimeToExpireDays(q.my_forecasts?.latest);
      return timeToExpireDays && timeToExpireDays < 0;
    }).length;
  }, [questions]);

  const [groupOptions, setGroupOptions] = useState<ContinuousGroupOption[]>(
    generateGroupOptions({
      questions,
      prevForecastValuesMap,
      permission,
      post,
      onPredictionSubmit,
    })
  );

  // ensure options have the latest forecast data
  useEffect(() => {
    const newGroupOptions = generateGroupOptions({
      questions,
      prevForecastValuesMap,
      permission,
      post,
      onPredictionSubmit,
    });
    setGroupOptions((prev) =>
      prev.map((o) => {
        const newOption = newGroupOptions.find((q) => q.id === o.question.id);
        // we want to reset all options if we withdraw/reaffirm all group subquestions using button unter the table
        // but when updating a single subquestion, we want to reset only that subquestion state
        return {
          ...o,
          ...(resetTarget.current === "all" || resetTarget.current === o.id
            ? newOption
            : o),
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
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const questionsToSubmit = useMemo(
    () =>
      groupOptions.filter(
        (option) =>
          option.question.status === QuestionStatus.OPEN &&
          (option.isDirty || option.hasUserForecast)
      ),
    [groupOptions]
  );

  const handleForecastExpiration = useCallback(
    (optionId: number, forecastExpiration: ForecastExpirationValue) => {
      setGroupOptions((prev) =>
        prev.map((option) => {
          if (option.id === optionId) {
            return {
              ...option,
              forecastExpiration,
            };
          }
          return option;
        })
      );
    },
    []
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
    async (questionId: number, forecastExpiration: ForecastExpirationValue) => {
      const optionToSubmit = questionsToSubmit.find(
        (opt) => opt.id === questionId
      );

      if (!optionToSubmit) return;

      setIsSubmitting(true);
      const response = await createForecasts(postId, [
        {
          questionId: optionToSubmit.question.id,
          forecastEndTime: forecastExpirationToDate(forecastExpiration),
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
                    optionToSubmit.question
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
      onPredictionSubmit?.();
      setIsSubmitting(false);
      return response;
    },
    [postId, questionsToSubmit, onPredictionSubmit]
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
          forecastExpiration,
        }) => {
          return {
            questionId: question.id,
            forecastEndTime: forecastExpirationToDate(forecastExpiration),
            forecastData: {
              continuousCdf:
                forecastInputMode === ContinuousForecastInputType.Quantile
                  ? getQuantileNumericForecastDataset(
                      userQuantileForecast,
                      question
                    ).cdf
                  : getSliderNumericForecastDataset(
                      getNormalizedContinuousForecast(userSliderForecast),
                      question
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
    onPredictionSubmit?.();
    setIsSubmitting(false);
  }, [postId, questionsToSubmit, t, onPredictionSubmit]);

  const predictedQuestions = useMemo(() => {
    return questions
      .filter((q) =>
        isOpenQuestionPredicted(q, { treatClosedAsPredicted: false })
      )
      .map((q) => ({
        ...q,
        forecastExpiration: buildDefaultForecastExpiration(
          q,
          user?.prediction_expiration_percent ?? undefined
        ),
      }));
  }, [questions, user?.prediction_expiration_percent]);

  const handlePredictWithdraw = useCallback(
    async (questionId?: number) => {
      resetTarget.current = questionId === undefined ? "all" : questionId;

      setSubmitError(undefined);
      setIsSubmitting(true);
      const response = await withdrawForecasts(
        postId,
        isNil(questionId)
          ? predictedQuestions.map((q) => ({
              question: q.id,
            }))
          : [{ question: questionId }]
      );
      setIsSubmitting(false);

      if (response && "errors" in response && !!response.errors) {
        setSubmitError(response.errors);
      }
      setIsWithdrawModalOpen(false);
      onPredictionSubmit?.();
      return response;
    },
    [postId, predictedQuestions, onPredictionSubmit]
  );

  const handlePredictionReaffirm = useCallback(async () => {
    resetTarget.current = "all";
    setSubmitError(undefined);
    setIsSubmitting(true);
    const response = await createForecasts(
      postId,
      predictedQuestions.map(({ my_forecasts, id, forecastExpiration }) => {
        const latest = my_forecasts?.latest as UserForecast;
        return {
          questionId: id,
          forecastEndTime: forecastExpirationToDate(forecastExpiration),
          forecastData: {
            continuousCdf: latest.forecast_values,
            probabilityYesPerCategory: null,
            probabilityYes: null,
          },
          distributionInput: latest.distribution_input,
        };
      })
    );

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    onPredictionSubmit?.();
  }, [postId, predictedQuestions, onPredictionSubmit]);

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
        handlePredictWithdraw={handlePredictWithdraw}
        handleForecastInputModeChange={handleForecastInputModeChange}
        handleCopy={handleCopy}
        handleForecastExpiration={handleForecastExpiration}
        permission={permission}
      />

      <div className="mx-auto mb-2 mt-4 flex flex-wrap justify-center gap-3">
        {questions.some((q) => canWithdrawForecast(q, permission)) && (
          <WithdrawButton
            type="button"
            isPromptOpen={isWithdrawModalOpen}
            isPending={isSubmitting}
            onSubmit={handlePredictWithdraw}
            onPromptVisibilityChange={setIsWithdrawModalOpen}
          >
            {t("withdrawAll")}
          </WithdrawButton>
        )}
        {predictedQuestions.length > 0 && (
          <Button
            variant="secondary"
            type="submit"
            disabled={isSubmitting}
            onClick={handlePredictionReaffirm}
          >
            {t("reaffirmAll")}
          </Button>
        )}

        {questionsToSubmit.some((opt) => opt.isDirty) && (
          <>
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
          </>
        )}
      </div>

      <div className="mt-2 flex flex-col items-center text-xs text-salmon-800 dark:text-salmon-800-dark">
        {soonToExpireForecastsCount > 0 && (
          <div>
            {t("predictionsSoonToBeWidthdrawnText", {
              count: soonToExpireForecastsCount,
            })}
          </div>
        )}
        {expiredForecastsCount > 0 && (
          <div>
            {t("predictionsWithdrawnText", { count: expiredForecastsCount })}
          </div>
        )}
      </div>

      <FormError
        errors={submitError}
        className="mt-2 flex items-center justify-center"
        detached
      />
    </>
  );
};

function generateGroupOptions({
  questions,
  prevForecastValuesMap,
  permission,
  post,
  onPredictionSubmit,
}: {
  questions: QuestionWithNumericForecasts[];
  prevForecastValuesMap: Record<
    number,
    DistributionSlider | DistributionQuantile | undefined
  >;
  permission?: ProjectPermissions;
  post?: Post;
  onPredictionSubmit?: () => void;
}): ContinuousGroupOption[] {
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
          onPredictionSubmit={onPredictionSubmit}
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
