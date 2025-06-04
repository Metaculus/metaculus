"use client";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil, round } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, ReactNode, useCallback, useMemo, useState } from "react";

import {
  createForecasts,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import {
  AggregateForecastHistory,
  QuestionWithMultipleChoiceForecasts,
  UserForecast,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { sendPredictEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";

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
import QuestionResolutionButton from "../resolution";
import QuestionUnresolveButton from "../resolution/unresolve_button";
import WithdrawButton from "../withdraw/withdraw_button";

type ChoiceOption = {
  name: string;
  communityForecast: number | null;
  forecast: number | null;
  color: ThemeColor;
};

type Props = {
  post: PostWithForecasts;
  question: QuestionWithMultipleChoiceForecasts;
  permission?: ProjectPermissions;
  canPredict: boolean;
  canResolve: boolean;
  predictionMessage: ReactNode;
  onPredictionSubmit?: () => void;
};

const ForecastMakerMultipleChoice: FC<Props> = ({
  post,
  question,
  permission,
  canPredict,
  canResolve,
  predictionMessage,
  onPredictionSubmit,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hideCP } = useHideCP();

  const activeUserForecast =
    (question.my_forecasts?.latest?.end_time ||
      new Date().getTime() / 1000 + 1000) <=
    new Date().getTime() / 1000
      ? undefined
      : question.my_forecasts?.latest;

  // Calculate question duration for expiration modal
  const questionDuration = useMemo(() => {
    return (
      new Date(question.scheduled_close_time).getTime() -
      new Date(question.open_time ?? question.created_at).getTime()
    );
  }, [question]);

  const expirationState = useExpirationModalState(
    questionDuration,
    question.my_forecasts?.latest
  );

  const {
    modalSavedState,
    setModalSavedState,
    expirationShortChip,
    isForecastExpirationModalOpen,
    setIsForecastExpirationModalOpen,
    previousForecastExpiration,
  } = expirationState;

  // Initialize default forecast expiration based on user preferences
  const defaultForecastExpiration = useMemo(() => {
    return buildDefaultForecastExpiration(
      question,
      user?.prediction_expiration_percent ?? undefined
    );
  }, [question, user?.prediction_expiration_percent]);

  // Set default expiration if not already set
  React.useEffect(() => {
    if (!modalSavedState.forecastExpiration) {
      setModalSavedState((prev) => ({
        ...prev,
        forecastExpiration: defaultForecastExpiration,
      }));
    }
  }, [
    defaultForecastExpiration,
    modalSavedState.forecastExpiration,
    setModalSavedState,
  ]);

  const [isDirty, setIsDirty] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [choicesForecasts, setChoicesForecasts] = useState<ChoiceOption[]>(
    generateChoiceOptions(
      question,
      question.aggregations.recency_weighted,
      activeUserForecast
    )
  );

  const equalizedForecast = useMemo(
    () => round(100 / choicesForecasts.length, 1),
    [choicesForecasts.length]
  );
  const forecastHasValues = useMemo(
    () => choicesForecasts.every((el) => el.forecast !== null),
    [choicesForecasts]
  );
  const forecastsSum = useMemo(
    () => (forecastHasValues ? sumForecasts(choicesForecasts) : null),
    [choicesForecasts, forecastHasValues]
  );
  const remainingSum = forecastsSum ? 100 - forecastsSum : null;
  const isForecastValid = forecastHasValues && forecastsSum === 100;

  const [submitError, setSubmitError] = useState<ErrorResponse>();

  const resetForecasts = useCallback(() => {
    setIsDirty(false);
    setChoicesForecasts((prev) =>
      question.options.map((_, index) => {
        // okay to do no-non-null-assertion, as choicesForecasts is mapped based on question.options
        // so there won't be a case where arrays are not of the same length
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const choiceOption = prev[index]!;
        const userForecast =
          question.my_forecasts?.latest?.forecast_values[index] ?? null;

        return {
          ...choiceOption,
          forecast: !isNil(userForecast)
            ? Math.round(userForecast * 1000) / 10
            : null,
        };
      })
    );
  }, [question.options, question.my_forecasts?.latest?.forecast_values]);

  const handleForecastChange = useCallback(
    (choice: string, value: number) => {
      setIsDirty(true);
      setChoicesForecasts((prev) =>
        prev.map((prevChoice) => {
          if (prevChoice.name === choice) {
            return { ...prevChoice, forecast: value };
          }

          const isInitialChange = prev.some((el) => el.forecast === null);

          if (isInitialChange) {
            // User is predicting for the first time. Show default non-null values
            // for remaining options after first interaction with the inputs.
            return { ...prevChoice, forecast: equalizedForecast };
          }

          return prevChoice;
        })
      );
    },
    [equalizedForecast]
  );

  const rescaleForecasts = () => {
    if (!forecastHasValues || !forecastsSum === null) return;

    // Due to floating point arithmetic, the sum may be slightly off. We fix
    // this by adjusting the max prediction to guarantee the sum is 1.
    let adjustIndex = 0;
    let maxValue = 0;
    const newForecasts = choicesForecasts.map((choice, index) => {
      if (isNil(choice.forecast) || isNil(forecastsSum)) {
        return null;
      }

      const value = round(
        Math.max(round((100 * choice.forecast) / forecastsSum, 1), 0.1),
        1
      );
      if (value > maxValue) {
        adjustIndex = index;
        maxValue = value;
      }
      return value;
    });

    const adjustedItemForecast = newForecasts[adjustIndex];
    if (!isNil(adjustedItemForecast)) {
      newForecasts[adjustIndex] = Math.max(
        round(
          adjustedItemForecast +
            100 -
            newForecasts.reduce<number>((acc, value) => acc + (value ?? 0), 0),
          1
        ),
        0.1
      );
    }

    setChoicesForecasts((prev) =>
      prev.map((choice, index) => ({
        ...choice,
        forecast: newForecasts[index] ?? choice.forecast,
      }))
    );
  };

  const handlePredictSubmit = useCallback(
    async (forecastExpiration?: ForecastExpirationValue) => {
      setSubmitError(undefined);

      if (!isForecastValid) return;

      const forecastValue: Record<string, number> = {};
      choicesForecasts.forEach((el) => {
        const forecast = el.forecast;
        if (!isNil(forecast)) {
          forecastValue[el.name] = round(
            forecast / 100,
            BINARY_FORECAST_PRECISION
          );
        }
      });
      sendPredictEvent(post, question, hideCP);
      const response = await createForecasts(post.id, [
        {
          questionId: question.id,
          forecastEndTime: forecastExpirationToDate(
            forecastExpiration ?? modalSavedState.forecastExpiration
          ),
          forecastData: {
            continuousCdf: null,
            probabilityYes: null,
            probabilityYesPerCategory: forecastValue,
          },
        },
      ]);
      setIsDirty(false);
      if (response && "errors" in response && !!response.errors) {
        setSubmitError(response.errors);
      }
      onPredictionSubmit?.();
    },
    [
      isForecastValid,
      choicesForecasts,
      post,
      question,
      hideCP,
      modalSavedState.forecastExpiration,
      onPredictionSubmit,
    ]
  );
  const [submit, isPending] = useServerAction(handlePredictSubmit);

  const handlePredictWithdraw = async () => {
    setSubmitError(undefined);

    if (!activeUserForecast) return;

    const response = await withdrawForecasts(post.id, [
      {
        question: question.id,
      },
    ]);
    setIsDirty(false);

    if (response && "errors" in response && !!response.errors) {
      setSubmitError(response.errors);
    } else {
      resetForecasts();
      setIsWithdrawModalOpen(false);
      onPredictionSubmit?.();
    }
  };
  const [withdraw, withdrawalIsPending] = useServerAction(
    handlePredictWithdraw
  );

  return (
    <>
      <ForecastExpirationModal
        savedState={modalSavedState}
        setSavedState={setModalSavedState}
        isOpen={isForecastExpirationModalOpen}
        onClose={() => {
          setIsForecastExpirationModalOpen(false);
        }}
        questionDuration={questionDuration}
        onReaffirm={isDirty ? undefined : submit}
      />
      <table className="border-separate rounded border border-gray-300 bg-gray-0 dark:border-gray-300-dark dark:bg-gray-0-dark">
        <thead>
          <tr>
            <th className="bg-blue-100 p-2 text-left text-xs font-bold dark:bg-blue-100-dark">
              {question.group_variable}
            </th>
            <th className="bg-blue-100 p-2 pr-4 text-right text-xs dark:bg-blue-100-dark">
              <FontAwesomeIcon
                icon={faUserGroup}
                size="sm"
                className="align-middle text-olive-700 dark:text-olive-700-dark"
              />
            </th>
            <th
              className="hidden bg-blue-100 p-2 text-left text-xs font-bold text-orange-800 dark:bg-blue-100-dark dark:text-orange-800-dark sm:table-cell"
              colSpan={2}
            >
              My Prediction
            </th>
            <th className="bg-blue-100 p-2 text-center text-xs font-bold text-orange-800 dark:bg-blue-100-dark dark:text-orange-800-dark sm:hidden">
              Me
            </th>
          </tr>
        </thead>
        <tbody>
          {choicesForecasts.map((choice) => (
            <ForecastChoiceOption
              key={choice.name}
              id={choice.name}
              forecastValue={choice.forecast}
              defaultSliderValue={equalizedForecast}
              choiceName={choice.name}
              choiceColor={choice.color}
              communityForecast={
                !user || !hideCP ? choice.communityForecast : null
              }
              inputMin={BINARY_MIN_VALUE}
              inputMax={BINARY_MAX_VALUE}
              onChange={handleForecastChange}
              isDirty={isDirty}
              disabled={!canPredict}
              optionResolution={{
                type: "question",
                resolution: question.resolution,
              }}
            />
          ))}
        </tbody>
      </table>
      {predictionMessage && (
        <div className="my-2 text-center text-sm italic text-gray-700 dark:text-gray-700-dark">
          {predictionMessage}
        </div>
      )}

      <div className="flex flex-col  border-b border-b-blue-400 pb-5 dark:border-b-blue-400-dark">
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 ">
          <div className="mx-auto text-center sm:ml-0 sm:text-left">
            <div>
              <span className="text-2xl font-bold">
                Total: {getForecastPctString(forecastsSum)}
              </span>
            </div>
            <span className="mt-1 text-sm">
              ({getForecastPctString(remainingSum)} remaining)
            </span>
          </div>
          {canPredict && (
            <div className="flex flex-wrap justify-center gap-2">
              <div className="w-full text-center sm:w-auto">
                <Button
                  className="h-8"
                  variant="link"
                  type="button"
                  onClick={rescaleForecasts}
                  disabled={!forecastHasValues || isForecastValid}
                >
                  {t("rescalePrediction")}
                </Button>
              </div>
              {isDirty ? (
                <Button
                  variant="secondary"
                  type="reset"
                  onClick={resetForecasts}
                >
                  {t("discardChangesButton")}
                </Button>
              ) : (
                !!activeUserForecast && (
                  <WithdrawButton
                    type="button"
                    isPromptOpen={isWithdrawModalOpen}
                    isPending={withdrawalIsPending}
                    onSubmit={withdraw}
                    onPromptVisibilityChange={setIsWithdrawModalOpen}
                  >
                    {t("withdraw")}
                  </WithdrawButton>
                )
              )}
              <PredictButton
                onSubmit={submit}
                isDirty={isDirty}
                hasUserForecast={forecastHasValues}
                isPending={isPending}
                isDisabled={!isForecastValid}
                predictionExpirationChip={expirationShortChip}
                onPredictionExpirationClick={() =>
                  setIsForecastExpirationModalOpen(true)
                }
              />
            </div>
          )}
        </div>

        {previousForecastExpiration && (
          <div
            className={cn(
              "border-b-lue ml-auto mt-2 text-center text-xs text-gray-800 dark:text-gray-800-dark",
              previousForecastExpiration.expiresSoon &&
                "text-salmon-800 dark:text-salmon-800-dark"
            )}
          >
            {previousForecastExpiration.isExpired
              ? t("predictionExpiredText", {
                  time: previousForecastExpiration.string,
                })
              : t("predictionWillExpireInText", {
                  time: previousForecastExpiration.string,
                })}
          </div>
        )}
      </div>

      <FormError
        errors={submitError}
        className="ml-auto mt-2 flex w-full justify-center"
        detached
      />
      <div className="h-[32px] w-full">
        {(isPending || withdrawalIsPending) && <LoadingIndicator />}
      </div>
      <div className="flex flex-col items-center justify-center">
        <QuestionUnresolveButton question={question} permission={permission} />

        {canResolve && (
          <QuestionResolutionButton
            question={question}
            permission={permission}
          />
        )}
      </div>
    </>
  );
};

function generateChoiceOptions(
  question: QuestionWithMultipleChoiceForecasts,
  aggregate: AggregateForecastHistory,
  activeUserForecast: UserForecast | undefined
): ChoiceOption[] {
  const latest = aggregate.latest;

  const choiceItems = question.options.map((option, index) => {
    const communityForecastValue = latest?.forecast_values[index];
    const userForecastValue = activeUserForecast?.forecast_values[index];

    return {
      name: option,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      communityForecast:
        latest && !latest.end_time && !isNil(communityForecastValue)
          ? Math.round(communityForecastValue * 1000) / 1000
          : null,
      forecast: !isNil(userForecastValue)
        ? Math.round(userForecastValue * 1000) / 10
        : null,
    };
  });
  const resolutionIndex = question.options.findIndex(
    (_, index) => question.options[index] === question.resolution
  );
  if (resolutionIndex !== -1) {
    const [resolutionItem] = choiceItems.splice(resolutionIndex, 1);
    if (resolutionItem) {
      choiceItems.unshift(resolutionItem);
    }
  }
  return choiceItems;
}

function sumForecasts(choiceOptions: ChoiceOption[]) {
  return choiceOptions.reduce((acc, { forecast }) => {
    // Handle JS math of float numbers
    return (acc * 10 + Number(forecast) * 10) / 10;
  }, 0);
}

function getForecastPctString(number: number | null) {
  if (number === null) return "?";

  return `${round(number, 1)}%`;
}

export default ForecastMakerMultipleChoice;
