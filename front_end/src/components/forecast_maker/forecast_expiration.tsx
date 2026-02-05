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
import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import PredictButton from "@/components/forecast_maker/predict_button";
import { useAuth } from "@/contexts/auth_context";
import { QuestionWithForecasts, UserForecast } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  formatDurationToShortStr,
  truncateDuration,
} from "@/utils/formatters/date";

import BaseModal from "../base_modal";
import Button from "../ui/button";
import { ContinuousGroupOption } from "./continuous_group_accordion/group_forecast_accordion";

interface ForecastExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedState: ModalState;
  setSavedState: Dispatch<SetStateAction<ModalState>>;
  onSubmit?: (forecastExpiration: ForecastExpirationValue) => Promise<void>;
  questionDuration: number;
  isDirty: boolean;
  hasUserForecast: boolean;
  isUserForecastActive?: boolean;
  isSubmissionDisabled?: boolean;
}

type Preset = { id: string; duration?: Duration };
type DurationPreset = Required<Preset>;

export type ForecastExpirationValue =
  | { kind: "duration"; value: Duration }
  | { kind: "date"; value: Date }
  | { kind: "infinity" };

interface ModalState {
  selectedPreset: Preset["id"];
  forecastExpiration: ForecastExpirationValue;
  datePickerDate: Date | null;
}

export const forecastExpirationToDate = (
  expiration: ForecastExpirationValue | undefined
): Date | undefined => {
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

const MIN_DEFAULT_EXPIRATION_DURATION_SEC = 30 * 24 * 60 * 60; // 30 days in seconds

const durationPresets: DurationPreset[] = [
  { id: "1d", duration: { days: 1 } },
  { id: "3d", duration: { days: 3 } },
  { id: "1w", duration: { weeks: 1 } },
  { id: "1m", duration: { months: 1 } },
  { id: "3m", duration: { months: 3 } },
  { id: "1y", duration: { years: 1 } },
  { id: "3y", duration: { years: 3 } },
];

const modalPresets: Preset[] = [
  ...durationPresets,
  { id: "customDate" },
  { id: "neverWithdraw" },
] as const;

type ForecastLike = Pick<UserForecast, "end_time">;

export const getTimeToExpireDays = (
  lastForecast: ForecastLike | undefined
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

export function getEffectiveLatest(opt: ContinuousGroupOption) {
  if (opt.wasWithdrawn) {
    return {
      end_time: opt.withdrawnEndTimeSec ?? Math.floor(Date.now() / 1000),
    };
  }
  if (opt.forecastExpiration) {
    const d = forecastExpirationToDate(opt.forecastExpiration);
    if (d) return { end_time: Math.floor(d.getTime() / 1000) };
  }
  return opt.question.my_forecasts?.latest;
}

export const buildDefaultForecastExpiration = (
  question: QuestionWithForecasts,
  userPredictionExpirationPercent: number | undefined
): ForecastExpirationValue => {
  const lastForecast = question.my_forecasts?.latest;

  const questionDuration =
    new Date(question.scheduled_close_time).getTime() -
    new Date(question.open_time ?? question.created_at).getTime();

  const userDefaultExpirationDurationSec = userPredictionExpirationPercent
    ? Math.max(
        ((userPredictionExpirationPercent / 100) * questionDuration) / 1000,
        MIN_DEFAULT_EXPIRATION_DURATION_SEC
      )
    : null;

  const defaultState = buildDefaultState(
    lastForecast,
    userDefaultExpirationDurationSec
  );

  return defaultState.forecastExpiration;
};

const getClosestPresetFromDuration = (duration: number): DurationPreset => {
  const presetsWithDurationMs = durationPresets.map((preset) => ({
    durationMs: add(new Date(0), preset.duration).getTime(),
    preset,
  }));

  return presetsWithDurationMs.reduce((closest, current) => {
    const diffClosest = Math.abs(duration - closest.durationMs);
    const diffCurrent = Math.abs(duration - current.durationMs);
    return diffCurrent < diffClosest ? current : closest;
  }).preset;
};

const buildDefaultState = (
  lastForecast: UserForecast | undefined,
  userDefaultExpirationDurationSec: number | null
): ModalState => {
  /*
  - 1. if the user doesn't have an auto-withdraw value set (i.e.: never auto withdraw), use that (highest priority)
  - 2.if the user has an auto-withdraw setting value, use it only if there's no previous forecast
  - 3. if they do have a previous forecast, use that forecast duration to find the closest preset to use
  */

  // case 1, user has their setting to never auto withdraw
  if (!userDefaultExpirationDurationSec) {
    return {
      selectedPreset: "neverWithdraw",
      forecastExpiration: { kind: "infinity" },
      datePickerDate: null,
    };
  }

  // case 2, user has some value in their setting and no previous forecast, so using that value
  if (!lastForecast) {
    const closestPreset = getClosestPresetFromDuration(
      userDefaultExpirationDurationSec * 1000
    );

    return {
      selectedPreset: closestPreset.id,
      datePickerDate: null,
      forecastExpiration: {
        kind: "duration",
        value: closestPreset.duration,
      },
    };
  }

  // case 3.a - user has a previous forecast with without an auto-withdraw date

  if (lastForecast.end_time == null) {
    return {
      selectedPreset: "neverWithdraw",
      datePickerDate: null,
      forecastExpiration: { kind: "infinity" },
    };
  }

  // case 3.b - user has a previous forecast with an auto-withdraw date

  // Convert the last forecast duration to milliseconds for comparison
  const lastForecastDurationMs =
    (lastForecast.end_time - lastForecast.start_time) * 1000;
  const closestPreset = getClosestPresetFromDuration(lastForecastDurationMs);

  return {
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
    { id: "3y", label: t("3years") },
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
    ? Math.max(
        ((userExpirationPercent / 100) * questionDuration) / 1000,
        MIN_DEFAULT_EXPIRATION_DURATION_SEC
      )
    : null;

  const initialState = buildDefaultState(
    lastForecast,
    userDefaultExpirationDurationSec
  );

  const [modalSavedState, setModalSavedState] =
    useState<ModalState>(initialState);

  useEffect(() => {
    // When the user last forecast changes (user withdraws), we need to update the chip to duration closed to the last user forecast
    setModalSavedState(
      buildDefaultState(lastForecast, userDefaultExpirationDurationSec)
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
  onSubmit,
  questionDuration,
  isDirty,
  hasUserForecast,
  isUserForecastActive,
  isSubmissionDisabled,
}) => {
  const t = useTranslations();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const userExpirationPercent = user?.prediction_expiration_percent ?? null;
  const userDefaultExpirationDurationSec = userExpirationPercent
    ? Math.max(
        ((userExpirationPercent / 100) * questionDuration) / 1000,
        MIN_DEFAULT_EXPIRATION_DURATION_SEC
      )
    : null;

  const datePickerDate = savedState.datePickerDate;
  useEffect(() => {
    if (!datePickerDate) return;
    setSavedState((prev) => ({
      ...prev,
      forecastExpiration: {
        kind: "date",
        value: datePickerDate,
      },
    }));
  }, [datePickerDate, setSavedState]);

  const onCustomOptionSelected = (preset: Preset) => {
    setSavedState({
      ...savedState,
      selectedPreset: preset.id,
      forecastExpiration: {
        kind: "duration",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        value: preset.duration!, // we know it's not undefined
      },
    });
    setShowDatePicker(false);
  };

  const onCustomDateSelected = () => {
    setSavedState({
      ...savedState,
      selectedPreset: "customDate",
      forecastExpiration: {
        kind: "date",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        value: savedState.datePickerDate!,
      },
    });
  };

  const onNeverExpiresSelected = () => {
    setSavedState({
      ...savedState,
      selectedPreset: "neverWithdraw",
      forecastExpiration: {
        kind: "infinity",
      },
    });
  };

  const handlePredict = async () => {
    onSubmit?.(savedState.forecastExpiration);
    onClose();
  };

  const handleReset = async () => {
    return setSavedState(
      buildDefaultState(undefined, userDefaultExpirationDurationSec)
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => onClose()}
      className="h-full w-full max-w-max md:h-auto"
    >
      <div className="flex flex-col gap-8 rounded bg-gray-0 dark:bg-gray-0-dark md:w-[628px]">
        <h2 className="mb-0 text-lg font-medium leading-7 text-gray-1000 dark:text-gray-1000-dark">
          {t("predictionAutoWithdrawalTitle")}
        </h2>

        <div className="flex flex-wrap gap-1">
          {modalPresets.slice(0, -2).map((preset) => (
            <Button
              key={getPresetLabel(preset.id, t)}
              type="button"
              variant={
                savedState.selectedPreset === preset.id
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
              savedState.selectedPreset === "customDate"
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
                  setSavedState({
                    ...savedState,
                    datePickerDate: selectedDate,
                  });
                }
              }}
            />

            {showDatePicker && savedState.datePickerDate && (
              <span className="text-sm">
                {": " + format(savedState.datePickerDate, "d MMMM yyyy")}
              </span>
            )}
          </Button>

          <Button
            key="neverWithdraw"
            type="button"
            variant={
              savedState.selectedPreset === "neverWithdraw"
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

        <div className="flex gap-2">
          <Button
            variant="tertiary"
            className="whitespace-nowrap"
            onClick={handleReset}
          >
            {t("resetToDefault")}
          </Button>
          <p className="my-0 text-xs text-gray-700 dark:text-gray-700-dark">
            {t.rich("useAccountSettingDescription", {
              userForecastExpirationPercent: userExpirationPercent,
              settingsLink: (chunk) => (
                <Link
                  href="/accounts/settings/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-700 underline dark:text-blue-700-dark"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  {chunk}
                </Link>
              ),
            })}
          </p>
        </div>

        {/* Helper text */}
        <p className="my-0 text-xs text-gray-700 dark:text-gray-700-dark">
          {t("predictionWithdrawalReminderHelpText")}
        </p>

        {/* Footer */}
        <div className="flex items-start justify-between">
          <Button type="button" onClick={() => onClose()} variant="tertiary">
            {t("close")}
          </Button>

          <PredictButton
            onSubmit={handlePredict}
            isDirty={isDirty}
            hasUserForecast={hasUserForecast}
            isUserForecastActive={isUserForecastActive}
            isPending={false}
            predictLabel={t("predict")}
            isDisabled={isSubmissionDisabled}
          />
        </div>
      </div>
    </BaseModal>
  );
};
