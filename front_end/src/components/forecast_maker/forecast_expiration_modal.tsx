import { faInfinity } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  add,
  Duration,
  format,
  formatDuration,
  intervalToDuration,
} from "date-fns";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { FC, useState, useRef, useEffect } from "react";

import { useAuth } from "@/contexts/auth_context";
import { UserForecast } from "@/types/question";
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
  //userForecastExpirationPercent: number | null;
  //userForecastExpirationDurationStr: string | null;
  onReaffirm?: (expiryDate: Date | null) => Promise<void>;
  questionDuration: number;
}

type Preset = { id: string; label: string; duration?: Duration };

const buildExpiryDate = (
  option: "account" | "custom",
  customExpiryDate: Date | null,
  durationFromNowSec: number | null,
  selectedPreset: Preset | undefined
) => {
  const today = new Date();

  if (option === "account") {
    return durationFromNowSec
      ? new Date(today.getTime() + durationFromNowSec * 1000)
      : null;
  }

  if (selectedPreset?.id === "customDate") {
    return customExpiryDate;
  }

  if (selectedPreset?.id === "neverExpires") {
    return null;
  }

  return add(today, selectedPreset?.duration ?? { days: 0 });
};

interface ModalState {
  option: "account" | "custom";
  selectedPreset: Preset["id"];
  expiryDate: Date | null;
  customDate: Date | null;
}

const buildDefaultState = (
  lastForecast: UserForecast | undefined,
  presetDurations: Preset[],
  userDefaultExpirationDurationSec: number | null
): ModalState => {
  let state: ModalState = {
    option: "account",
    selectedPreset: "1w",
    customDate: null,
    expiryDate: buildExpiryDate(
      "account",
      null,
      userDefaultExpirationDurationSec ?? null,
      presetDurations.find((p) => p.id === "1w")
    ),
  };

  if (lastForecast?.end_time) {
    // Convert the last forecast duration to milliseconds for comparison
    const lastForecastDurationMs =
      (lastForecast.end_time - lastForecast.start_time) * 1000;

    // Only consider presets with actual durations and transform them in
    const presetsDurationssMs = presetDurations
      .filter((preset) => !!preset.duration)
      .map((preset) => {
        return {
          durationMs: preset.duration
            ? add(new Date(0), preset.duration).getTime()
            : Infinity,
          id: preset.id,
        };
      });

    let closestPresetId = "1w"; // default fallback
    let minDifference = Infinity;

    for (const preset of presetsDurationssMs) {
      const difference = Math.abs(lastForecastDurationMs - preset.durationMs);
      if (difference < minDifference) {
        minDifference = difference;
        closestPresetId = preset.id;
      }
    }

    state = {
      option: "custom",
      selectedPreset: closestPresetId,
      expiryDate: null,
      customDate: null,
    };

    state.expiryDate = buildExpiryDate(
      state.option,
      state.customDate,
      null,
      presetDurations.find((p) => p.id === state.selectedPreset)
    );
  }

  return state;
};

const getPresetDurations = (t: ReturnType<typeof useTranslations>): Preset[] =>
  [
    { id: "1d", label: t("1day"), duration: { days: 1 } },
    { id: "3d", label: t("3days"), duration: { days: 3 } },
    { id: "1w", label: t("1week"), duration: { weeks: 1 } },
    { id: "1m", label: t("1month"), duration: { months: 1 } },
    { id: "3m", label: t("3months"), duration: { months: 3 } },
    { id: "1y", label: t("1year"), duration: { years: 1 } },
    { id: "customDate", label: t("customDate") },
    { id: "neverExpires", label: t("neverExpires") },
  ] as const;

export const useExpirationModalState = (
  questionDuration: number,
  lastForecast: UserForecast | undefined
) => {
  const [isForecastExpirationModalOpen, setIsForecastExpirationModalOpen] =
    useState(false);
  const t = useTranslations();
  const presetDurations = getPresetDurations(t);

  const { user } = useAuth();
  const userExpirationPercent = user?.prediction_expiration_percent ?? null;
  const userDefaultExpirationDurationSec = userExpirationPercent
    ? ((userExpirationPercent / 100) * questionDuration) / 1000
    : null;

  const initialState = buildDefaultState(
    lastForecast,
    presetDurations,
    userDefaultExpirationDurationSec
  );

  const [modalSavedState, setModalSavedState] =
    useState<ModalState>(initialState);

  const isForecastExpirationEnabled = useFeatureFlagEnabled(
    "forecast_expiration"
  );

  let expirationShortChip: React.ReactNode = (
    <FontAwesomeIcon icon={faInfinity} />
  );

  if (modalSavedState.expiryDate) {
    expirationShortChip = formatDurationToShortStr(
      truncateDuration(
        intervalToDuration({
          start: new Date(),
          end: add(modalSavedState.expiryDate, {
            seconds: 10, // add some extra time to avoid rounding issues and not falling on the next lower unit
          }),
        }),
        1
      )
    );
  }

  let previousForecastExpirationString = undefined;

  if (lastForecast?.end_time) {
    const lastForecastExpiryDuration = intervalToDuration({
      start: new Date(lastForecast.start_time * 1000),
      end: new Date(lastForecast.end_time * 1000),
    });

    previousForecastExpirationString = formatDuration(
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
  }

  if (!isForecastExpirationEnabled) {
    expirationShortChip = undefined;
    previousForecastExpirationString = undefined;
  }

  return {
    modalSavedState,
    setModalSavedState,
    expirationShortChip,
    isForecastExpirationModalOpen,
    setIsForecastExpirationModalOpen,
    previousForecastExpirationString,
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

  const restoreFromSavedState = () => {
    setCurrentState({ ...savedState });
  };

  const presetDurations = getPresetDurations(t);

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

  // intervalToDuration is needed so the duration will contain all units
  const userDefaultExpirationDuration = userDefaultExpirationDurationSec
    ? truncateDuration(
        intervalToDuration({
          start: new Date(),
          end: add(new Date(), {
            seconds: userDefaultExpirationDurationSec,
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

  useEffect(() => {
    const expiryDate = buildExpiryDate(
      currentState.option,
      currentState.customDate,
      userDefaultExpirationDurationSec ?? null,
      presetDurations.find((p) => p.id === currentState.selectedPreset)
    );

    setCurrentState({ ...currentState, expiryDate });
  }, [
    currentState.selectedPreset,
    currentState.customDate,
    currentState.option,
  ]);

  const onCustomOptionSelected = (id: Preset["id"]) => {
    setCurrentState({
      ...currentState,
      selectedPreset: id,
      option: "custom",
    });
    setShowDatePicker(false);
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
    onReaffirm?.(currentState.expiryDate);
    handleSave();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => handleClose()}
      className="h-full w-full max-w-max px-3 md:h-auto"
    >
      <div className="flex flex-col gap-4 rounded bg-gray-0 p-6 dark:bg-gray-0-dark md:w-[628px]">
        <h2 className="text-lg font-medium leading-7 text-black dark:text-gray-100-dark">
          {t("predictionExpiration")}
        </h2>

        <div
          className={optionClasses(currentState.option === "account")}
          onClick={() => {
            setCurrentState({ ...currentState, option: "account" });
          }}
        >
          <div className="flex items-center gap-2.5 lg:items-start">
            <span className="flex h-4 w-4 items-center justify-center">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#161c22] dark:border-gray-100-dark">
                {currentState.option === "account" && (
                  <span className="h-2 w-2 rounded-full bg-[#161c22] dark:bg-gray-100-dark" />
                )}
              </span>
            </span>

            <div className="flex flex-1 flex-col gap-1">
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
                  className="ml-1 font-bold text-blue-700 underline dark:text-blue-400-dark"
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
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#161c22] dark:border-gray-100-dark">
                {currentState.option === "custom" && (
                  <span className="h-2 w-2 rounded-full bg-[#161c22] dark:bg-gray-100-dark" />
                )}
              </span>
            </span>
            <p className="my-0 text-base leading-normal">
              {t("useCustomExpiration")}
            </p>
          </div>

          {currentState.option === "custom" && (
            <div className="mt-3 flex flex-wrap gap-1">
              {presetDurations.slice(0, -2).map((preset) => (
                <Button
                  key={preset.label}
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
                    onCustomOptionSelected(preset.id);
                  }}
                >
                  {preset.label}
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
                  onCustomOptionSelected("customDate");
                  setShowDatePicker(true);
                  setTimeout(() => {
                    dateInputRef.current?.showPicker();
                  }, 0);
                }}
              >
                {t("customDate")}

                {showDatePicker && (
                  <>
                    <input
                      ref={dateInputRef}
                      type="datetime-local"
                      className="absolute left-0 top-0 opacity-0"
                      onChange={(e) => {
                        setCurrentState({
                          ...currentState,
                          customDate: new Date(e.target.value),
                        });
                      }}
                    />
                    {currentState.customDate && (
                      <span className="text-sm">
                        {": " + format(currentState.customDate, "d MMMM yyyy")}
                      </span>
                    )}
                  </>
                )}
              </Button>

              <Button
                key="neverExpires"
                type="button"
                variant={
                  currentState.selectedPreset === "neverExpires" &&
                  currentState.option === "custom"
                    ? "primary"
                    : "secondary"
                }
                className={cn("rounded-[3px]")}
                onClick={(e) => {
                  e.stopPropagation();
                  onCustomOptionSelected("neverExpires");
                  setShowDatePicker(false);
                }}
              >
                {t("neverExpires")}
              </Button>
            </div>
          )}
        </div>

        {/* Helper text */}
        <p className="mx-auto max-w-[408px] text-wrap text-center text-sm leading-tight text-gray-700 dark:text-gray-400-dark">
          {t("expirationHelpText")}
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
              currentState.expiryDate === savedState.expiryDate
            }
          >
            {onReaffirm ? t("reaffirm") : t("saveChanges")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
