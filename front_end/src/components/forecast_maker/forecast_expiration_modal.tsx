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
import { FC, useState, useRef } from "react";

import { useAuth } from "@/contexts/auth_context";
import { UserForecast } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  formatDurationToShortStr,
  truncateDuration,
} from "@/utils/formatters/date";

import BaseModal from "../base_modal";
import Button from "../ui/button";
import { useFeatureFlagEnabled, usePostHog } from "posthog-js/react";

interface ForecastExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedState: ModalState;
  setSavedState: (state: ModalState) => void;
  userForecastExpirationPercent: number | null;
  userForecastExpirationDurationStr: string | null;
}

type Preset = { id: string; label: string; duration?: Duration };

const buildExpiryDate = (
  option: "account" | "custom",
  customExpiryDate: Date | null,
  durationFromNowMs: number | null,
  selectedPreset: Preset | undefined
) => {
  const today = new Date();

  if (option === "account") {
    return durationFromNowMs
      ? new Date(today.getTime() + durationFromNowMs)
      : null;
  }

  if (option === "custom" && selectedPreset?.id === "customDate") {
    return customExpiryDate;
  }

  if (option === "custom" && selectedPreset?.id === "neverExpires") {
    return null;
  }

  return add(today, selectedPreset?.duration ?? { days: 0 });
};

interface ModalState {
  option: "account" | "custom";
  selectedPreset: Preset["id"];
  expiryDate: Date | null;
}

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

  const [modalSavedState, setModalSavedState] = useState<ModalState>({
    option: "account",
    selectedPreset: "1w",
    expiryDate: null,
  });
  const { user } = useAuth();
  const t = useTranslations();
  const presetDurations = getPresetDurations(t);
  const isForecastExpirationEnabled = useFeatureFlagEnabled(
    "forecast_expiration"
  );

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

  const finalExpiryDate = buildExpiryDate(
    modalSavedState.option,
    modalSavedState.expiryDate,
    userDefaultExpirationDurationSec
      ? userDefaultExpirationDurationSec * 1000
      : null,
    presetDurations.find((p) => p.id === modalSavedState.selectedPreset)
  );

  let expirationShortChip: React.ReactNode = (
    <FontAwesomeIcon icon={faInfinity} />
  );

  if (finalExpiryDate) {
    expirationShortChip = formatDurationToShortStr(
      truncateDuration(
        intervalToDuration({
          start: new Date(),
          end: add(finalExpiryDate, {
            seconds: 100, // add some extra time to avoid rounding issues and not falling on the next lower unit
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
      lastForecastExpiryDuration,
      {
        format: ["years", "months", "weeks", "days", "hours"],
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
    userDefaultExpirationDurationStr,
    userExpirationPercent,
    expirationShortChip,
    expiryDate: finalExpiryDate,
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
  userForecastExpirationPercent,
  userForecastExpirationDurationStr,
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

  const onCustomOptionSelected = (id: Preset["id"]) => {
    setCurrentState({ ...currentState, selectedPreset: id, option: "custom" });
    setShowDatePicker(false);
  };

  const handleClose = () => {
    onClose();
    restoreFromSavedState();
  };

  const handleSave = () => {
    setSavedState({ ...currentState });
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => handleClose()}
      className="h-full w-full max-w-3xl px-3 md:h-auto"
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
              <p className="text-base md:mt-0 md:leading-none">
                {t("useAccountSetting")}
                <span className="ml-1 font-medium">
                  (
                  {userForecastExpirationDurationStr ?? (
                    <FontAwesomeIcon icon={faInfinity} />
                  )}
                  )
                </span>
              </p>
              <p className="text-xs leading-none">
                {t("useAccountSettingDescription", {
                  userForecastExpirationPercent,
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
          <div className="flex items-center gap-2.5">
            {/* radio */}
            <span className="flex h-4 w-4 items-center justify-center">
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#161c22] dark:border-gray-100-dark">
                {currentState.option === "custom" && (
                  <span className="h-2 w-2 rounded-full bg-[#161c22] dark:bg-gray-100-dark" />
                )}
              </span>
            </span>
            <p className="text-base leading-normal">
              {t("useCustomExpiration")}
            </p>
          </div>

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
                        expiryDate: new Date(e.target.value),
                      });
                    }}
                  />
                  {currentState.expiryDate && (
                    <span className="text-sm">
                      {": " + format(currentState.expiryDate, "d MMMM yyyy")}
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
            onClick={() => {
              handleSave();
            }}
          >
            {t("saveChanges")}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};
