"use client";
import { faEllipsis, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { round } from "lodash";
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

import { SLUG_POST_SUB_QUESTION_ID } from "@/app/(main)/questions/[id]/search_params";
import {
  createForecasts,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import ForecastPredictionMessage from "@/components/forecast_maker/prediction_message";
import GroupQuestionResolution from "@/components/group_question_resolution";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import {
  Post,
  PostWithForecasts,
  ProjectPermissions,
  QuestionStatus,
  Resolution,
} from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { ThemeColor } from "@/types/theme";
import cn from "@/utils/core/cn";
import {
  isForecastActive,
  isOpenQuestionPredicted,
} from "@/utils/forecasts/helpers";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts/initial_values";
import { canWithdrawForecast } from "@/utils/questions/predictions";

import ForecastMakerGroupControls from "./forecast_maker_group_menu";
import {
  BINARY_FORECAST_PRECISION,
  BINARY_MAX_VALUE,
  BINARY_MIN_VALUE,
} from "../binary_slider";
import ForecastChoiceOption from "../forecast_choice_option";
import {
  buildDefaultForecastExpiration,
  ForecastExpirationModal,
  forecastExpirationToDate,
  ForecastExpirationValue,
  useExpirationModalState,
} from "../forecast_expiration";
import PredictButton from "../predict_button";
import WithdrawButton from "../withdraw/withdraw_button";

type QuestionOption = {
  id: number;
  name: string;
  communityForecast: number | null;
  forecast: number | null;
  resolution: Resolution | null;
  isDirty: boolean;
  color: ThemeColor;
  menu: ReactNode;
  status?: QuestionStatus;
  forecastExpiration?: ForecastExpirationValue;
  defaultSliderValue: number;
  wasWithdrawn: boolean;
  withdrawnEndTimeSec?: number | null;
};

type Props = {
  post: PostWithForecasts;
  questions: QuestionWithNumericForecasts[];
  groupVariable: string;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage: ReactNode;
  onPredictionSubmit?: () => void;
};

const ForecastMakerGroupBinary: FC<Props> = ({
  post,
  questions,
  groupVariable,
  canPredict,
  predictionMessage,
  onPredictionSubmit,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const params = useSearchParams();
  const subQuestionId = Number(params.get(SLUG_POST_SUB_QUESTION_ID));

  const { id: postId, user_permission: permission } = post;

  const prevForecastValuesMap = useMemo(
    () =>
      questions.reduce<Record<number, number | null>>((acc, question) => {
        const latest = question.my_forecasts?.latest;
        return {
          ...acc,
          [question.id]: latest
            ? extractPrevBinaryForecastValue(latest.forecast_values[1])
            : null,
        };
      }, {}),
    [questions]
  );
  const hasUserForecast = useMemo(
    () => Object.values(prevForecastValuesMap).some((v) => v !== null),
    [prevForecastValuesMap]
  );

  const hasSomeActiveUserForecasts = useMemo(
    () => questions.some((q) => isOpenQuestionPredicted(q)),
    [questions]
  );

  // Calculate average duration for the group questions for expiration modal
  const averageQuestionDuration = useMemo(() => {
    const durations = questions.map(
      (q) =>
        new Date(q.scheduled_close_time).getTime() -
        new Date(q.open_time ?? q.created_at).getTime()
    );
    return (
      durations.reduce((sum, duration) => sum + duration, 0) / durations.length
    );
  }, [questions]);

  const firstOpenQuestion = questions.find(
    (q) => q.status === QuestionStatus.OPEN
  );
  const expirationState = useExpirationModalState(
    averageQuestionDuration,
    firstOpenQuestion?.my_forecasts?.latest // Use first open question as reference
  );

  const {
    modalSavedState,
    setModalSavedState,
    expirationShortChip,
    isForecastExpirationModalOpen,
    setIsForecastExpirationModalOpen,
    previousForecastExpiration,
  } = expirationState;

  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>(
    generateChoiceOptions({
      questions,
      prevForecastValuesMap,
      post,
      onPredictionSubmit,
      userPredictionExpirationPercent:
        user?.prediction_expiration_percent ?? null,
    })
  );

  const sortedQuestionOptions = [...questionOptions].sort((a, b) => {
    if (!!subQuestionId) {
      if (a.id === subQuestionId) {
        return -1;
      } else if (b.id === subQuestionId) {
        return 1;
      }
    }
    return 0;
  });

  const [highlightedQuestionId, setHighlightedQuestionId] = useState<
    number | undefined
  >(subQuestionId || questionOptions.at(0)?.id);
  const highlightedQuestion = useMemo(
    () => questions.find((q) => q.id === highlightedQuestionId),
    [questions, highlightedQuestionId]
  );

  useEffect(() => {
    setQuestionOptions(
      generateChoiceOptions({
        questions,
        prevForecastValuesMap,
        permission,
        post,
        onPredictionSubmit,
        userPredictionExpirationPercent:
          user?.prediction_expiration_percent ?? null,
      })
    );
  }, [
    permission,
    prevForecastValuesMap,
    questions,
    post,
    onPredictionSubmit,
    user?.prediction_expiration_percent,
  ]);

  useEffect(() => {
    setQuestionOptions((prev) =>
      prev.map((option) => ({
        ...option,
        forecastExpiration: modalSavedState.forecastExpiration,
      }))
    );
  }, [modalSavedState.forecastExpiration]);

  const [submitError, setSubmitError] = useState<ErrorResponse>();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const isPickerDirty = useMemo(
    () => questionOptions.some((option) => option.isDirty),
    [questionOptions]
  );

  const questionsToSubmit = useMemo(() => {
    const byId = new Map(questions.map((q) => [q.id, q]));
    return questionOptions.filter((option) => {
      if (option.status !== QuestionStatus.OPEN) return false;
      if (option.isDirty) return true;
      if (!isPickerDirty && hasSomeActiveUserForecasts) {
        const q = byId.get(option.id);
        return q ? isOpenQuestionPredicted(q) : false;
      }
      return false;
    });
  }, [questionOptions, questions, isPickerDirty, hasSomeActiveUserForecasts]);

  const resetForecasts = useCallback(() => {
    setQuestionOptions((prev) =>
      prev.map((prevQuestion) => ({
        ...prevQuestion,
        isDirty: false,
        forecast: prevQuestion.wasWithdrawn
          ? null
          : prevForecastValuesMap[prevQuestion.id] ?? null,
      }))
    );
  }, [prevForecastValuesMap]);
  const handleForecastChange = useCallback((id: number, forecast: number) => {
    setQuestionOptions((prev) =>
      prev.map((prevQuestion) => {
        if (prevQuestion.id === id) {
          return { ...prevQuestion, isDirty: true, forecast };
        }

        return prevQuestion;
      })
    );
  }, []);
  const handlePredictSubmit = useCallback(
    async (forecastExpiration?: ForecastExpirationValue) => {
      setSubmitError(undefined);

      if (!questionsToSubmit.length) {
        return;
      }

      const response = await createForecasts(
        postId,
        questionsToSubmit.map((q) => {
          const forecastValue = round(
            // okay to use non-null assertion here because we handle nullable state in questionsToSubmit calculation
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            q.forecast! / 100,
            BINARY_FORECAST_PRECISION
          );

          return {
            questionId: q.id,
            forecastEndTime: forecastExpirationToDate(
              forecastExpiration ?? q.forecastExpiration
            ),
            forecastData: {
              probabilityYes: forecastValue,
              probabilityYesPerCategory: null,
              continuousCdf: null,
            },
          };
        })
      );
      setQuestionOptions((prev) =>
        prev.map((prevQuestion) => ({ ...prevQuestion, isDirty: false }))
      );

      if (response && "errors" in response && !!response.errors) {
        setSubmitError(response.errors);
      }
      onPredictionSubmit?.();
    },
    [postId, questionsToSubmit, onPredictionSubmit]
  );
  const [submit, isPending] = useServerAction(handlePredictSubmit);

  const predictedQuestions = useMemo(() => {
    return questions.filter((q) => isOpenQuestionPredicted(q));
  }, [questions]);

  const handlePredictWithdraw = useCallback(async () => {
    setSubmitError(undefined);
    const response = await withdrawForecasts(
      post.id,
      predictedQuestions.map((q) => ({
        question: q.id,
      }))
    );
    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    }
    setIsWithdrawModalOpen(false);
    onPredictionSubmit?.();
  }, [post, predictedQuestions, onPredictionSubmit]);
  const [withdraw, isWithdrawing] = useServerAction(handlePredictWithdraw);
  return (
    <>
      <ForecastExpirationModal
        savedState={modalSavedState}
        setSavedState={setModalSavedState}
        isOpen={isForecastExpirationModalOpen}
        onClose={() => {
          setIsForecastExpirationModalOpen(false);
        }}
        questionDuration={averageQuestionDuration}
        onSubmit={submit}
        isDirty={isPickerDirty}
        hasUserForecast={hasUserForecast}
        isUserForecastActive={hasSomeActiveUserForecasts}
        isSubmissionDisabled={!questionsToSubmit.length}
      />
      <table className="mt-3 border-separate rounded border border-gray-300 bg-gray-0 dark:border-gray-300-dark dark:bg-gray-0-dark">
        <thead>
          <tr>
            <th className="rounded-tl bg-blue-100 p-2 text-left text-xs font-bold dark:bg-blue-100-dark">
              {groupVariable}
            </th>
            <th className="bg-blue-100 p-2 pr-4 text-right text-xs dark:bg-blue-100-dark">
              <FontAwesomeIcon
                icon={faUserGroup}
                size="sm"
                className="align-middle text-olive-700 dark:text-olive-700-dark"
              />
            </th>
            <th
              className="hidden rounded-tr bg-blue-100 p-2 text-left text-xs font-bold text-orange-800 dark:bg-blue-100-dark dark:text-orange-800-dark sm:table-cell"
              colSpan={2}
            >
              My Prediction
            </th>
            <th className="rounded-tr bg-blue-100 p-2 text-center text-xs font-bold text-orange-800 dark:bg-blue-100-dark dark:text-orange-800-dark sm:hidden">
              Me
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedQuestionOptions.map((questionOption) => (
            <ForecastChoiceOption
              key={questionOption.id}
              id={questionOption.id}
              highlightedOptionId={highlightedQuestionId}
              onOptionClick={setHighlightedQuestionId}
              forecastValue={questionOption.forecast}
              defaultSliderValue={questionOption.defaultSliderValue}
              choiceName={questionOption.name}
              choiceColor={questionOption.color}
              communityForecast={
                !user || !hideCP ? questionOption.communityForecast : null
              }
              inputMin={BINARY_MIN_VALUE}
              inputMax={BINARY_MAX_VALUE}
              onChange={handleForecastChange}
              isDirty={questionOption.isDirty}
              withdrawn={questionOption.wasWithdrawn}
              withdrawnEndTimeSec={questionOption.withdrawnEndTimeSec}
              isRowDirty={questionOption.isDirty}
              menu={questionOption.menu}
              disabled={
                !canPredict || questionOption.status !== QuestionStatus.OPEN
              }
              optionResolution={{
                resolution: questionOption.resolution,
                type: "group_question",
              }}
            />
          ))}
        </tbody>
      </table>
      <ForecastPredictionMessage predictionMessage={predictionMessage} />
      {!!highlightedQuestion?.resolution && (
        <div className="flex flex-row items-center justify-center gap-1.5 truncate py-2 text-gray-900 dark:text-gray-900-dark">
          <GroupQuestionResolution
            question={highlightedQuestion}
            resolution={highlightedQuestion.resolution}
          />
        </div>
      )}
      {canPredict && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 px-4">
            {!!user && (
              <>
                <Button
                  variant="secondary"
                  type="reset"
                  onClick={resetForecasts}
                  disabled={!isPickerDirty}
                >
                  {t("discardChangesButton")}
                </Button>

                {questions.some((q) => canWithdrawForecast(q, permission)) && (
                  <WithdrawButton
                    type="button"
                    isPromptOpen={isWithdrawModalOpen}
                    isPending={isPending || isWithdrawing}
                    onSubmit={withdraw}
                    onPromptVisibilityChange={setIsWithdrawModalOpen}
                  >
                    {t("withdrawAll")}
                  </WithdrawButton>
                )}
              </>
            )}

            <PredictButton
              onSubmit={submit}
              isDirty={isPickerDirty}
              hasUserForecast={hasUserForecast}
              isUserForecastActive={hasSomeActiveUserForecasts}
              isPending={isPending || isWithdrawing}
              isDisabled={!questionsToSubmit.length}
              predictionExpirationChip={expirationShortChip}
              onPredictionExpirationClick={() =>
                setIsForecastExpirationModalOpen(true)
              }
            />
          </div>

          {previousForecastExpiration && (
            <div
              className={cn(
                "mt-2 text-center text-xs text-gray-800 dark:text-gray-800-dark",
                previousForecastExpiration.expiresSoon &&
                  "text-salmon-800 dark:text-salmon-800-dark"
              )}
            >
              {previousForecastExpiration.isExpired
                ? t("predictionWithdrawnText", {
                    time: previousForecastExpiration.string,
                  })
                : t("predictionWillBeWithdrawInText", {
                    time: previousForecastExpiration.string,
                  })}
            </div>
          )}

          <FormError
            errors={submitError}
            className="mt-2 flex items-center justify-center"
            detached
          />
          {isPending && (
            <div className="h-[32px] w-full">
              <LoadingIndicator />
            </div>
          )}
        </>
      )}
    </>
  );
};

function generateChoiceOptions({
  questions,
  prevForecastValuesMap,
  permission,
  post,
  onPredictionSubmit,
  userPredictionExpirationPercent,
}: {
  questions: QuestionWithNumericForecasts[];
  prevForecastValuesMap: Record<number, number | null>;
  permission?: ProjectPermissions;
  post?: Post;
  onPredictionSubmit?: () => void;
  userPredictionExpirationPercent?: number | null;
}): QuestionOption[] {
  const { question: shortestLifetimeQuestion } = questions.reduce(
    ({ question, min }, q) => {
      const questionDuration =
        new Date(q.scheduled_close_time).getTime() -
        new Date(q.open_time ?? q.created_at).getTime();
      return {
        question: questionDuration < min ? q : question,
        min: Math.min(min, questionDuration),
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    { question: questions[0]!, min: Infinity }
  );

  const forecastExpiration = buildDefaultForecastExpiration(
    shortestLifetimeQuestion,
    userPredictionExpirationPercent ?? undefined
  );

  return questions.map((question, index) => {
    const latest =
      question.aggregations[question.default_aggregation_method].latest;

    const last = question.my_forecasts?.latest;
    const wasWithdrawn = !!last?.end_time && last.end_time * 1000 < Date.now();
    const prev = prevForecastValuesMap[question.id];
    return {
      id: question.id,
      name: question.label,
      communityForecast:
        latest && isForecastActive(latest) ? latest.centers?.[0] ?? null : null,
      forecast: wasWithdrawn ? null : prev ?? null,
      resolution: question.resolution,
      isDirty: false,
      defaultSliderValue: prev ?? 50,
      wasWithdrawn,
      withdrawnEndTimeSec: last?.end_time ?? null,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      status: question.status,
      forecastExpiration,
      menu: (
        <ForecastMakerGroupControls
          question={question}
          permission={permission}
          button={
            <Button className="h-8 w-8" variant="tertiary">
              <FontAwesomeIcon icon={faEllipsis}></FontAwesomeIcon>
            </Button>
          }
          post={post}
          onPredictionSubmit={onPredictionSubmit}
        />
      ),
    };
  });
}

export default ForecastMakerGroupBinary;
