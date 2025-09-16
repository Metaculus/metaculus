import { faInfinity } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  add,
  Duration,
  endOfDay,
  format,
  formatDuration,
  intervalToDuration,
} from "date-fns";
import Link from "next/link";
import { useTranslations } from "next-intl";
import posthog from "posthog-js";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { FC, useState, useRef, useEffect } from "react";

import { useAuth } from "@/contexts/auth_context";
import { QuestionWithForecasts, UserForecast } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  formatDurationToShortStr,
  truncateDuration,
} from "@/utils/formatters/date";

import BaseModal from "../base_modal";
import Button from "../ui/button";

interface ForecastExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedState: ModalState;
  setSavedState: (state: ModalState) => void;
  onReaffirm?: (forecastExpiration: ForecastExpirationValue) => Promise<void>;
  questionDuration: number;
}

type Preset = { id: string; duration?: Duration };

export type ForecastExpirationValue =
  | { kind: "duration"; value: Duration }
  | { kind: "date"; value: Date }
  | { kind: "infinity" };

interface ModalState {
  option: "account" | "custom";
  selectedPreset: Preset["id"];
  forecastExpiration: ForecastExpirationValue;
  datePickerDate: Date | null;
}

export const forecastExpirationToDate = (
  expiration: ForecastExpirationValue | undefined
): Date | undefined => {
  if (!posthog.getFeatureFlag("forecast_expiration")) {
    return undefined;
  }

  if (!expiration) {
    return undefined;
  }

  if (expiration.kind === "infinity") {
    return undefined;
  }

  if (expiration.kind === "duration") {
    return add(new Date(), expiration.value);
  }
  return expiration.value;
};

const modalPresets: Preset[] = [
  { id: "1d", duration: { days: 1 } },
  { id: "3d", duration: { days: 3 } },
  { id: "1w", duration: { weeks: 1 } },
  { id: "1m", duration: { months: 1 } },
  { id: "3m", duration: { months: 3 } },
  { id: "1y", duration: { years: 1 } },
  { id: "customDate" },
  { id: "neverWithdraw" },
] as const;

export const getTimeToExpireDays = (
  lastForecast: UserForecast | undefined
): number | undefined => {
  if (lastForecast?.end_time) {
    const lastForecastExpiryDate = new Date(lastForecast.end_time * 1000);

    const lastForecastExpiryDuration = intervalToDuration({
      start: new Date(),
      end: lastForecastExpiryDate,
    });

    return (
      add(new Date(0), lastForecastExpiryDuration).getTime() /
      1000 /
      60 /
      60 /
      24
    );
  }
};

export const buildDefaultForecastExpiration = (
  question: QuestionWithForecasts,
  userPredictionExpirationPercent: number | undefined
): ForecastExpirationValue => {
  const lastForecast = question.my_forecasts?.latest;

  const questionDuration =
    new Date(question.scheduled_close_time).getTime() -
    new Date(question.open_time ?? question.created_at).getTime();

  const userDefaultExpirationDurationSec = userPredictionExpirationPercent
    ? ((userPredictionExpirationPercent / 100) * questionDuration) / 1000
    : null;

  const defaultState = buildDefaultState(
    lastForecast,
    modalPresets,
    userDefaultExpirationDurationSec
  );

  return defaultState.forecastExpiration;
};

const buildDefaultState = (
  lastForecast: UserForecast | undefined,
  presetDurations: Preset[],
  userDefaultExpirationDurationSec: number | null
): ModalState => {
  /*
  - 1. if the user doesn't have an auto-withdraw value set (i.e.: never auto withdraw), use that (highest priority)
  - 2.if the user has an auto-withdraw setting value, use it only if there's no previous forecast
  - 3. if they do have a previous forecast, use that forecast duration to find the closest preset to use
  */

  const now = new Date();

  // case 1, user has their setting to never auto withdraw
  if (!userDefaultExpirationDurationSec) {
    return {
      option: "account",
      selectedPreset: "neverWithdraw",
      forecastExpiration: { kind: "infinity" },
      datePickerDate: null,
    };
  }

  // case 2, user has some value in their setting and no previous forecast, so using that value
  if (!lastForecast) {
    return {
      option: "account",
      selectedPreset: "1w",
      datePickerDate: null,
      forecastExpiration: {
        kind: "duration",
        value: intervalToDuration({
          start: now,
          end: add(now, {
            seconds: Math.max(
              userDefaultExpirationDurationSec,
              30 * 24 * 60 * 60 // 1 month minimum (30 days in seconds)
            ),
          }),
        }),
      },
    };
  }

  // case 3.a - user has a previous forecast with without an auto-withdraw date

  if (lastForecast.end_time == null) {
    return {
      option: "custom",
      selectedPreset: "neverWithdraw",
      datePickerDate: null,
      forecastExpiration: { kind: "infinity" },
    };
  }

  // case 3.b - user has a previous forecast with an auto-withdraw date

  // Convert the last forecast duration to milliseconds for comparison
  const lastForecastDurationMs =
    (lastForecast.end_time - lastForecast.start_time) * 1000;
  // Only consider presets with actual durations and transform them in
  const presetsWithDurationMs = presetDurations
    .filter((preset) => !!preset.duration)
    .map((preset) => {
      return {
        durationMs: preset.duration
          ? add(new Date(0), preset.duration).getTime()
          : Infinity,
        preset,
      };
    });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let closestPreset = presetsWithDurationMs[0]!.preset; // we know it's not undefined because we filtered it out above
  let minDifference = Infinity;

  for (const preset of presetsWithDurationMs) {
    const difference = Math.abs(lastForecastDurationMs - preset.durationMs);
    if (difference < minDifference) {
      minDifference = difference;
      closestPreset = preset.preset;
    }
  }

  return {
    option: "custom",
    selectedPreset: closestPreset.id,
    forecastExpiration: {
      kind: "duration",
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      value: closestPreset.duration!, // we know it's not undefined because we filtered it out above
    },
    datePickerDate: null,
  };
};

const getPresetLabel = (
  presetID: Preset["id"],
  t: ReturnType<typeof useTranslations>
) => {
  const presets = [
    { id: "1d", label: t("1day") },
    { id: "3d", label: t("3days") },
    { id: "1w", label: t("1week") },
    { id: "1m", label: t("1month") },
    { id: "3m", label: t("3months") },
    { id: "1y", label: t("1year") },
    { id: "customDate", label: t("customDate") },
    { id: "neverWithdraw", label: t("neverWithdraw") },
  ] as const;

  return presets.find((preset) => preset.id === presetID)?.label;
};

export const useExpirationModalState = (
  questionDuration: number,
  lastForecast: UserForecast | undefined
) => {
  const [isForecastExpirationModalOpen, setIsForecastExpirationModalOpen] =
    useState(false);

  const { user } = useAuth();
  const userExpirationPercent = user?.prediction_expiration_percent ?? null;
  const userDefaultExpirationDurationSec = userExpirationPercent
    ? ((userExpirationPercent / 100) * questionDuration) / 1000
    : null;

  const initialState = buildDefaultState(
    lastForecast,
    modalPresets,
    userDefaultExpirationDurationSec
  );

  const [modalSavedState, setModalSavedState] =
    useState<ModalState>(initialState);

  const isForecastExpirationEnabled = useFeatureFlagEnabled(
    "forecast_expiration"
  );

  useEffect(() => {
    // When the user last forecast changes (user withdraws), we need to update the chip to duration closed to the last user forecast
    setModalSavedState(
      buildDefaultState(
        lastForecast,
        modalPresets,
        userDefaultExpirationDurationSec
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastForecast]);

  let expirationShortChip: React.ReactNode = (
    <FontAwesomeIcon icon={faInfinity} />
  );

  if (modalSavedState.forecastExpiration.kind === "duration") {
    expirationShortChip = formatDurationToShortStr(
      truncateDuration(modalSavedState.forecastExpiration.value, 1)
    );
  } else if (modalSavedState.forecastExpiration.kind === "date") {
    expirationShortChip = formatDurationToShortStr(
      truncateDuration(
        intervalToDuration({
          start: new Date(),
          end: modalSavedState.forecastExpiration.value,
        }),
        1
      )
    );
  }

  let previousForecastExpiration = undefined;

  if (lastForecast?.end_time) {
    const lastForecastExpiryDate = new Date((lastForecast.end_time - 1) * 1000); //make this one second earlier, to avoid having 0 seconds as expiration delta
    const previousForecastIsExpired = lastForecastExpiryDate <= new Date();

    const lastForecastExpiryDuration = intervalToDuration({
      start: previousForecastIsExpired ? lastForecastExpiryDate : new Date(),
      end: previousForecastIsExpired ? new Date() : lastForecastExpiryDate,
    });

    const previousForecastExpirationString = formatDuration(
      truncateDuration(lastForecastExpiryDuration, 2),
      {
        format: [
          "years",
          "months",
          "weeks",
          "days",
          "hours",
          "minutes",
          "seconds",
        ],
      }
    );

    const timeToExpireDays =
      add(new Date(0), lastForecastExpiryDuration).getTime() /
      1000 /
      60 /
      60 /
      24;

    previousForecastExpiration = {
      string: previousForecastExpirationString,
      isExpired: previousForecastIsExpired,
      expiresSoon: previousForecastIsExpired || timeToExpireDays < 2,
    };
  }

  if (!isForecastExpirationEnabled) {
    expirationShortChip = undefined;
    previousForecastExpiration = undefined;
  }

  return {
    modalSavedState,
    setModalSavedState,
    expirationShortChip,
    isForecastExpirationModalOpen,
    setIsForecastExpirationModalOpen,
    previousForecastExpiration,
  };
};

export const ForecastExpirationModal: FC<ForecastExpirationModalProps> = ({
  isOpen,
  onClose,
  savedState,
  setSavedState,
  onReaffirm,
  questionDuration,
}) => {
  const t = useTranslations();

  const [currentState, setCurrentState] = useState<ModalState>(savedState);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentState({ ...savedState });
  }, [savedState]);

  const restoreFromSavedState = () => {
    setCurrentState({ ...savedState });
  };

  const optionClasses = (selected: boolean) =>
    cn(
      "border rounded p-4 flex flex-col gap-2 cursor-pointer bg-gray-0 border-gray-400 dark:bg-gray-0-dark dark:border-gray-400-dark",
      selected &&
        "bg-blue-200 border-blue-500 dark:bg-blue-200-dark dark:border-blue-500-dark"
    );

  const { user } = useAuth();

  const userExpirationPercent = user?.prediction_expiration_percent ?? null;
  const userDefaultExpirationDurationSec = userExpirationPercent
    ? ((userExpirationPercent / 100) * questionDuration) / 1000
    : null;

  const now = new Date();

  // intervalToDuration is needed so the duration will contain all units
  const userDefaultExpirationDuration = userDefaultExpirationDurationSec
    ? truncateDuration(
        intervalToDuration({
          start: now,
          end: add(now, {
            seconds: Math.max(
              userDefaultExpirationDurationSec,
              30 * 24 * 60 * 60 // 1 month minimum (30 days in seconds)
            ),
          }),
        }),
        1
      )
    : null;

  const userDefaultExpirationDurationStr = userDefaultExpirationDuration
    ? formatDuration(userDefaultExpirationDuration, {
        format: [
          "years",
          "months",
          "weeks",
          "days",
          "hours",
          "minutes",
          "seconds",
        ],
      })
    : null;

  const datePickerDate = currentState.datePickerDate;
  useEffect(() => {
    if (!datePickerDate) return;
    setCurrentState((prev) => ({
      ...prev,
      forecastExpiration: {
        kind: "date",
        value: datePickerDate,
      },
    }));
  }, [datePickerDate]);

  const onCustomOptionSelected = (preset: Preset) => {
    setCurrentState({
      ...currentState,
      selectedPreset: preset.id,
      option: "custom",
      forecastExpiration: {
        kind: "duration",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        value: preset.duration!, // we know it's not undefined
      },
    });
    setShowDatePicker(false);
  };

  const onCustomDateSelected = () => {
    setCurrentState({
      ...currentState,
      selectedPreset: "customDate",
      option: "custom",
      forecastExpiration: {
        kind: "date",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        value: currentState.datePickerDate!,
      },
    });
  };

  const onAccountOptionSelected = () => {
    setCurrentState({
      ...currentState,
      option: "account",
      forecastExpiration: userDefaultExpirationDurationSec
        ? {
            kind: "date",
            value: add(new Date(), {
              seconds: userDefaultExpirationDurationSec,
            }),
          }
        : { kind: "infinity" },
    });
  };

  const onNeverExpiresSelected = () => {
    setCurrentState({
      ...currentState,
      selectedPreset: "neverWithdraw",
      option: "custom",
      forecastExpiration: {
        kind: "infinity",
      },
    });
  };

  const handleClose = () => {
    onClose();
    restoreFromSavedState();
  };

  const handleSave = async () => {
    onClose();
    setSavedState({ ...currentState });
  };

  const handleReaffirm = async () => {
    onReaffirm?.(currentState.forecastExpiration);
    handleSave();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => handleClose()}
      className="h-full w-full max-w-max md:h-auto"
    >
      <div className="flex flex-col gap-4 rounded bg-gray-0 dark:bg-gray-0-dark md:w-[628px]">
        <h2 className="text-lg font-medium leading-7 text-gray-1000 dark:text-gray-1000-dark">
          {t("predictionAutoWithdrawalTitle")}
        </h2>

        <div
          className={optionClasses(currentState.option === "account")}
          onClick={onAccountOptionSelected}
        >
          <div className="flex items-center gap-2.5 lg:items-start">
            <span className="flex h-4 w-4 items-center justify-center">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-900 dark:border-gray-900-dark">
                {currentState.option === "account" && (
                  <span className="h-2 w-2 rounded-full bg-gray-900 dark:bg-gray-900-dark" />
                )}
              </span>
            </span>

            <div className="flex flex-1 flex-col gap-2">
              <p className="my-0 text-base md:mt-0 md:leading-none">
                {t("useAccountSetting")}
                <span className="ml-1 font-medium">
                  (
                  {userDefaultExpirationDurationStr ?? (
                    <FontAwesomeIcon icon={faInfinity} />
                  )}
                  )
                </span>
              </p>
              <p className="my-0 text-xs leading-none">
                {t("useAccountSettingDescription", {
                  userForecastExpirationPercent: userExpirationPercent,
                })}
                <Link
                  href="/accounts/settings/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 font-bold text-blue-700 underline dark:text-blue-700-dark"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {t("change")}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div
          className={optionClasses(currentState.option === "custom")}
          onClick={() => setCurrentState({ ...currentState, option: "custom" })}
        >
          <div className="flex items-center gap-3">
            {/* radio */}
            <span className="flex h-4 w-4 items-center justify-center">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-900 dark:border-gray-900-dark">
                {currentState.option === "custom" && (
                  <span className="h-2 w-2 rounded-full bg-gray-900 dark:bg-gray-900-dark" />
                )}
              </span>
            </span>
            <p className="my-0 text-base leading-normal">
              {t("useCustomDuration")}
            </p>
          </div>

          {currentState.option === "custom" && (
            <div className="mt-3 flex flex-wrap gap-1">
              {modalPresets.slice(0, -2).map((preset) => (
                <Button
                  key={getPresetLabel(preset.id, t)}
                  type="button"
                  variant={
                    currentState.selectedPreset === preset.id &&
                    currentState.option === "custom"
                      ? "primary"
                      : "secondary"
                  }
                  className={cn("rounded-[3px]")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCustomOptionSelected(preset);
                  }}
                >
                  {getPresetLabel(preset.id, t)}
                </Button>
              ))}

              <Button
                key="customDate"
                type="button"
                variant={
                  currentState.selectedPreset === "customDate" &&
                  currentState.option === "custom"
                    ? "primary"
                    : "secondary"
                }
                className={"relative flex items-center gap-0 rounded-[3px]"}
                onClick={(e) => {
                  e.stopPropagation();
                  onCustomDateSelected();
                  setShowDatePicker(true);
                  // Call showPicker synchronously for iOS compatibility
                  dateInputRef.current?.showPicker();
                }}
              >
                {t("customDate")}

                {/* Always render input but conditionally show the date display */}
                <input
                  ref={dateInputRef}
                  type="date"
                  className="absolute left-0 top-0 opacity-0"
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    const selectedDate = endOfDay(new Date(e.target.value));
                    const now = new Date();
                    // Only update if the selected date is not in the past
                    if (selectedDate >= now) {
                      setCurrentState({
                        ...currentState,
                        datePickerDate: selectedDate,
                      });
                    }
                  }}
                />

                {showDatePicker && currentState.datePickerDate && (
                  <span className="text-sm">
                    {": " + format(currentState.datePickerDate, "d MMMM yyyy")}
                  </span>
                )}
              </Button>

              <Button
                key="neverWithdraw"
                type="button"
                variant={
                  currentState.selectedPreset === "neverWithdraw" &&
                  currentState.option === "custom"
                    ? "primary"
                    : "secondary"
                }
                className={cn("rounded-[3px]")}
                onClick={(e) => {
                  e.stopPropagation();
                  onNeverExpiresSelected();
                  setShowDatePicker(false);
                }}
              >
                {t("neverWithdraw")}
              </Button>
            </div>
          )}
        </div>

        {/* Helper text */}
        <p className="mx-auto max-w-[408px] text-wrap text-center text-sm leading-tight text-gray-700 dark:text-gray-700-dark">
          {t("predictionWithdrawalReminderHelpText")}
        </p>

        {/* Footer */}
        <div className="flex items-start justify-between">
          <Button
            type="button"
            onClick={() => handleClose()}
            variant="tertiary"
          >
            {t("close")}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={onReaffirm ? handleReaffirm : handleSave}
            disabled={
              currentState.option === savedState.option &&
              currentState.selectedPreset === savedState.selectedPreset &&
              JSON.stringify(currentState.forecastExpiration) ===
                JSON.stringify(savedState.forecastExpiration)
            }
          >
            {onReaffirm ? t("reaffirm") : t("saveChanges")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
