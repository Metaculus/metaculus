"use client";
import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil, round } from "lodash";
import { useTranslations } from "next-intl";
import {
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createForecasts,
  withdrawForecasts,
} from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import LoadingIndicator from "@/components/ui/loading_indicator";
import Tooltip from "@/components/ui/tooltip";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import useAppTheme from "@/hooks/use_app_theme";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { PostWithForecasts } from "@/types/post";
import {
  MultipleChoiceAggregateForecastHistory,
  MultipleChoiceOptionsOrder,
  MultipleChoiceUserForecast,
  QuestionWithMultipleChoiceForecasts,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { sendPredictEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import {
  isForecastActive,
  isOpenQuestionPredicted,
} from "@/utils/forecasts/helpers";
import {
  getAllOptionsHistory,
  getUpcomingOptions,
} from "@/utils/questions/helpers";

import {
  BINARY_FORECAST_PRECISION,
  BINARY_MAX_VALUE,
  BINARY_MIN_VALUE,
} from "../binary_slider";
import ForecastChoiceOption, {
  ANIMATION_DURATION_MS,
} from "../forecast_choice_option";
import useGracePeriodCountdown from "./use_grace_period_countdown";
import {
  buildDefaultForecastExpiration,
  ForecastExpirationModal,
  forecastExpirationToDate,
  ForecastExpirationValue,
  useExpirationModalState,
} from "../forecast_expiration";
import PredictButton from "../predict_button";
import WithdrawButton from "../withdraw/withdraw_button";

type ChoiceOption = {
  name: string;
  label?: string;
  communityForecast: number | null;
  forecast: number | null;
  color: ThemeColor;
};

type NewOptionCalloutProps = {
  newOptions: Array<{ name: string; color: ThemeColor }>;
  mounted: boolean;
  getThemeColor: (color: ThemeColor) => string;
  gracePeriodEnd: Date | null;
  onShowNewOptions: () => void;
  onDismiss: () => void;
};

const NewOptionCallout: FC<NewOptionCalloutProps> = ({
  newOptions,
  mounted,
  getThemeColor,
  gracePeriodEnd,
  onShowNewOptions,
  onDismiss,
}) => {
  const t = useTranslations();
  const isPlural = newOptions.length > 1;
  const timeRemaining = useGracePeriodCountdown(gracePeriodEnd);

  return (
    <div className="mb-3 w-full rounded-lg bg-blue-900 p-4 shadow-lg dark:bg-blue-900-dark">
      <div className="mb-0 flex flex-col-reverse items-start justify-between gap-2 sm:flex-row sm:gap-2">
        <p className="mt-0 flex-1 text-sm text-gray-0 dark:text-gray-0-dark">
          {isPlural ? t("newOptionsAddedPlural") : t("newOptionsAddedSingular")}
        </p>
        {timeRemaining && timeRemaining !== "expired" && (
          <Tooltip
            tooltipContent={t("gracePeriodTooltip")}
            placement="bottom"
            showDelayMs={200}
          >
            <div className="flex cursor-help items-center gap-1.5 rounded border border-blue-700 bg-blue-800 px-2.5 py-1 hover:border-blue-600 hover:bg-blue-700 dark:bg-blue-800-dark dark:hover:bg-blue-700-dark">
              <span className="text-xs font-medium text-blue-400 dark:text-blue-900">
                {t("timeRemaining")}:
              </span>
              <span className="text-sm font-bold text-blue-200 dark:text-blue-900">
                {timeRemaining}
              </span>
            </div>
          </Tooltip>
        )}
      </div>
      {isPlural && newOptions.length > 0 && mounted && (
        <div className="mb-3 flex flex-wrap gap-4">
          {newOptions.map((option) => (
            <div key={option.name} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: getThemeColor(option.color) }}
              />
              <span className="text-xs text-gray-0 dark:text-gray-0-dark">
                {option.name}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={onShowNewOptions}>
          {isPlural ? t("showNewOptions") : t("showNewOption")}
        </Button>
        <Button
          variant="text"
          size="sm"
          className="text-gray-0 hover:text-gray-100 dark:text-gray-0-dark dark:hover:text-gray-100-dark"
          onClick={onDismiss}
        >
          {t("dismiss")}
        </Button>
      </div>
    </div>
  );
};

type Props = {
  post: PostWithForecasts;
  question: QuestionWithMultipleChoiceForecasts;
  canPredict: boolean;
  predictionMessage: ReactNode;
  onPredictionSubmit?: () => void;
};

const ForecastMakerMultipleChoice: FC<Props> = ({
  post,
  question,
  canPredict,
  predictionMessage,
  onPredictionSubmit,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { hideCP } = useHideCP();
  const { getThemeColor } = useAppTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeUserForecast =
    question.my_forecasts?.latest &&
    isForecastActive(question.my_forecasts.latest)
      ? question.my_forecasts.latest
      : undefined;

  const userLastForecast = question.my_forecasts?.latest;

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
  useEffect(() => {
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
  const [dismissedOverlay, setDismissedOverlay] = useState(false);
  const [interactedOptions, setInteractedOptions] = useState<Set<string>>(
    new Set()
  );
  const [isAnimatingHighlight, setIsAnimatingHighlight] = useState(false);
  const [choicesForecasts, setChoicesForecasts] = useState<ChoiceOption[]>(
    generateChoiceOptions(
      question,
      question.aggregations[question.default_aggregation_method],
      userLastForecast,
      t
    )
  );

  const equalizedForecast = useMemo(
    () => round(100 / choicesForecasts.length, 1),
    [choicesForecasts.length]
  );
  const forecastHasValues = useMemo(
    () =>
      choicesForecasts.every(
        (el) => !question.options.includes(el.name) || el.forecast !== null
      ),
    [choicesForecasts, question.options]
  );
  const forecastsSum = useMemo(
    () =>
      forecastHasValues
        ? sumForecasts(
            choicesForecasts.filter((choice) =>
              question.options.includes(choice.name)
            )
          )
        : null,
    [question.options, choicesForecasts, forecastHasValues]
  );
  const remainingSum = forecastsSum ? 100 - forecastsSum : null;
  const isForecastValid = forecastHasValues && forecastsSum === 100;

  const [submitError, setSubmitError] = useState<ErrorResponse>();

  const showUserMustForecast =
    !!activeUserForecast &&
    activeUserForecast.forecast_values.filter((value) => value !== null)
      .length < question.options.length;

  const forecastValueByOption = useMemo(() => {
    if (!activeUserForecast) return new Map<string, number | null>();

    const allOptions = getAllOptionsHistory(question);
    return new Map(
      allOptions.map((option, index) => [
        option,
        activeUserForecast.forecast_values[index] ?? null,
      ])
    );
  }, [activeUserForecast, question]);

  const latestForecastValueByOption = useMemo(() => {
    const latestForecast = question.my_forecasts?.latest;
    if (!latestForecast) return new Map<string, number | null>();

    const allOptions = getAllOptionsHistory(question);
    return new Map(
      allOptions.map((option, index) => [
        option,
        latestForecast.forecast_values[index] ?? null,
      ])
    );
  }, [question]);

  const newOptions = useMemo(() => {
    if (!activeUserForecast) return [];

    return choicesForecasts
      .filter((choice) => {
        const isCurrentOption = question.options.includes(choice.name);
        const forecastValue = forecastValueByOption.get(choice.name);
        const hasForecast =
          typeof forecastValue !== "undefined" && forecastValue !== null;
        return isCurrentOption && !hasForecast;
      })
      .map((c) => ({ name: c.name, color: c.color }));
  }, [
    activeUserForecast,
    choicesForecasts,
    forecastValueByOption,
    question.options,
  ]);

  const newOptionNames = useMemo(
    () => new Set(newOptions.map((option) => option.name)),
    [newOptions]
  );
  const firstNewOptionName = newOptions[0]?.name;

  const showOverlay =
    showUserMustForecast && !dismissedOverlay && newOptions.length > 0;

  // Calculate grace period end time
  const gracePeriodEnd = useMemo(() => {
    if (!question.options_history || question.options_history.length === 0) {
      return null;
    }
    const lastTimestep = new Date(question.options_history.at(-1)?.[0] || 0);
    if (new Date().getTime() < lastTimestep.getTime()) {
      return null;
    }
    return lastTimestep;
  }, [question.options_history]);

  const firstNewOptionRef = useRef<HTMLTableRowElement | null>(null);

  const scrollToNewOptions = () => {
    if (firstNewOptionRef.current) {
      // Trigger animation immediately
      setIsAnimatingHighlight(true);

      firstNewOptionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Reset animation after duration
      setTimeout(() => {
        setIsAnimatingHighlight(false);
      }, ANIMATION_DURATION_MS);
    }
  };

  const resetForecasts = useCallback(() => {
    setIsDirty(false);
    setChoicesForecasts((prev) =>
      prev.map((choiceOption) => {
        const userForecast =
          latestForecastValueByOption.get(choiceOption.name) ?? null;

        return {
          ...choiceOption,
          forecast: !isNil(userForecast)
            ? Math.round(userForecast * 1000) / 10
            : null,
        };
      })
    );
  }, [latestForecastValueByOption]);

  const handleForecastChange = useCallback(
    (choice: string, value: number) => {
      setIsDirty(true);
      setChoicesForecasts((prev) =>
        prev.map((prevChoice) => {
          if (prevChoice.name === choice) {
            return { ...prevChoice, forecast: value };
          }

          const isInitialChange = prev.some((el) => el.forecast === null);

          if (isInitialChange && prevChoice.forecast === null) {
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
      if (!question.options.includes(choice.name)) {
        return 0.0;
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
        if (!question.options.includes(el.name)) {
          return; // only submit forecasts for current options
        }
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
        isDirty={isDirty}
        hasUserForecast={forecastHasValues}
        isUserForecastActive={isOpenQuestionPredicted(question)}
        isSubmissionDisabled={!isForecastValid}
        onSubmit={submit}
      />
      {showOverlay && (
        <NewOptionCallout
          newOptions={newOptions}
          mounted={mounted}
          getThemeColor={getThemeColor}
          gracePeriodEnd={gracePeriodEnd}
          onShowNewOptions={scrollToNewOptions}
          onDismiss={() => setDismissedOverlay(true)}
        />
      )}
      <table className="border-separate rounded border border-gray-300 bg-gray-0 dark:border-gray-300-dark dark:bg-gray-0-dark">
        <thead>
          <tr>
            <th className="rounded-tl bg-blue-100 px-3 py-2 text-left text-xs font-normal dark:bg-blue-100-dark">
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
          {choicesForecasts.map((choice) => {
            if (question.options.includes(choice.name)) {
              const isFirstNewOption = choice.name === firstNewOptionName;
              const isNewOption = newOptionNames.has(choice.name);
              return (
                <ForecastChoiceOption
                  key={choice.name}
                  id={choice.name}
                  forecastValue={choice.forecast}
                  defaultSliderValue={equalizedForecast}
                  choiceName={choice.label ?? choice.name}
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
                  isNewOption={isNewOption}
                  showHighlight={
                    isNewOption && !interactedOptions.has(choice.name)
                  }
                  isAnimating={isAnimatingHighlight}
                  onInteraction={() => {
                    isNewOption
                      ? setInteractedOptions((prev) =>
                          new Set(prev).add(choice.name)
                        )
                      : undefined;
                  }}
                  rowRef={isFirstNewOption ? firstNewOptionRef : undefined}
                />
              );
            }
          })}
        </tbody>
      </table>
      {predictionMessage && (
        <div className="mt-2 text-center text-sm text-gray-700 dark:text-gray-700-dark">
          {predictionMessage}
        </div>
      )}

      {canPredict && (
        <div className="flex flex-col pb-5">
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
                isUserForecastActive={isOpenQuestionPredicted(question)}
                isPending={isPending}
                isDisabled={!isForecastValid}
                predictionExpirationChip={expirationShortChip}
                onPredictionExpirationClick={() =>
                  setIsForecastExpirationModalOpen(true)
                }
              />
            </div>
          </div>

          {previousForecastExpiration && (
            <div
              className={cn(
                "border-b-lue mt-2 text-center text-xs text-gray-800 dark:text-gray-800-dark md:ml-auto",
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
        </div>
      )}

      <FormError
        errors={submitError}
        className="ml-auto mt-2 flex w-full justify-center"
        detached
      />
      {(isPending || withdrawalIsPending) && (
        <div className="h-[32px] w-full">
          <LoadingIndicator />
        </div>
      )}
    </>
  );
};

function generateChoiceOptions(
  question: QuestionWithMultipleChoiceForecasts,
  aggregate: MultipleChoiceAggregateForecastHistory,
  userLastForecast: MultipleChoiceUserForecast | undefined,
  t: ReturnType<typeof useTranslations>
): ChoiceOption[] {
  const latest = aggregate.latest;
  const allOptions = getAllOptionsHistory(question);
  const upcomingOptions = getUpcomingOptions(question);

  const choiceItems = allOptions.map((option, index) => {
    const isDeleted = !question.options.includes(option);
    const isUpcoming = upcomingOptions.includes(option);
    const communityForecastValue = latest?.forecast_values[index];
    const userForecastValue = userLastForecast?.forecast_values[index];

    return {
      name: option,
      label: isDeleted
        ? option + " (" + t("deleted") + ")"
        : isUpcoming
          ? option + " (" + t("Upcoming") + ")"
          : option,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      communityForecast:
        latest && !isNil(communityForecastValue)
          ? Math.round(communityForecastValue * 1000) / 1000
          : null,
      forecast: !isNil(userForecastValue)
        ? Math.round(userForecastValue * 1000) / 10
        : null,
    };
  });
  if (question.options_order === MultipleChoiceOptionsOrder.CP_DESC) {
    choiceItems.sort(
      (a, b) => (b.communityForecast ?? 0) - (a.communityForecast ?? 0)
    );
  }
  const resolutionIndex = choiceItems.findIndex(
    (item) => item.name === question.resolution
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
