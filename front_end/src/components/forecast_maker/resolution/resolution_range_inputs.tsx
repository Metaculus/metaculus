"use client";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { Input } from "@/components/ui/form_field";
import { QuestionType, Scaling } from "@/types/question";
import { unscaleNominalLocation } from "@/utils/math";

type CalendarUnit = "day" | "month" | "year";

/**
 * The UTC calendar day, month or year containing `value`, as [start, next start)
 */
export function getCalendarUnitBounds(
  value: string,
  unit: CalendarUnit
): { lower: string; upper: string } | null {
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const ranges: Record<CalendarUnit, [number, number]> = {
    day: [Date.UTC(year, month, day), Date.UTC(year, month, day + 1)],
    month: [Date.UTC(year, month, 1), Date.UTC(year, month + 1, 1)],
    year: [Date.UTC(year, 0, 1), Date.UTC(year + 1, 0, 1)],
  };
  const [start, end] = ranges[unit];
  return {
    lower: new Date(start).toISOString(),
    upper: new Date(end).toISOString(),
  };
}

type RangeQuestionType = QuestionType.Numeric | QuestionType.Date;

// bound strings to the scale of `Scaling` (dates in epoch seconds)
function toScaledLocation(value: string, questionType: RangeQuestionType) {
  return questionType === QuestionType.Date
    ? new Date(value).getTime() / 1000
    : Number(value);
}

function fromScaledLocation(location: number, questionType: RangeQuestionType) {
  return questionType === QuestionType.Date
    ? new Date(location * 1000).toISOString()
    : String(location);
}

export type RangeResolutionError =
  | "rangeResolutionOutsideRange"
  | "rangeResolutionInvalidOrder"
  | "rangeResolutionTooNarrow";

/**
 * Why these bounds can't be submitted, as a message key, or null if they can
 * (or aren't complete yet). The backend enforces all but the minimum width.
 */
export function getRangeResolutionError({
  questionType,
  scaling,
  inboundOutcomeCount,
  resolutionValue,
  lower,
  upper,
}: {
  questionType: RangeQuestionType;
  scaling: Scaling;
  inboundOutcomeCount: number;
  resolutionValue?: string;
  lower?: string;
  upper?: string;
}): RangeResolutionError | null {
  if (!lower || !upper || !resolutionValue) return null;
  const { range_min, range_max } = scaling;
  const low = toScaledLocation(lower, questionType);
  const high = toScaledLocation(upper, questionType);
  const value = toScaledLocation(resolutionValue, questionType);
  if (range_min === null || range_max === null) return null;
  // written so that NaN fails too
  if (!(range_min <= low && high <= range_max)) {
    return "rangeResolutionOutsideRange";
  }
  if (!(low <= value && value <= high && low < high)) {
    return "rangeResolutionInvalidOrder";
  }
  // One bin is 1 / inboundOutcomeCount of the internal [0, 1] scale, so on
  // log questions the minimum width in real units depends on where it sits.
  // The tolerance lets a range of exactly one bin through.
  const width =
    unscaleNominalLocation(high, scaling) -
    unscaleNominalLocation(low, scaling);
  if (width < 1 / inboundOutcomeCount - 1e-9) {
    return "rangeResolutionTooNarrow";
  }
  return null;
}

type Props = {
  questionType: RangeQuestionType;
  scaling: Scaling;
  error: RangeResolutionError | null;
  resolutionValue?: string;
  enabled: boolean;
  lower?: string;
  upper?: string;
  onEnabledChange: (enabled: boolean) => void;
  onBoundsChange: (lower?: string, upper?: string) => void;
};

const ResolutionRangeInputs: FC<Props> = ({
  questionType,
  scaling,
  error,
  resolutionValue,
  enabled,
  lower,
  upper,
  onEnabledChange,
  onBoundsChange,
}) => {
  const t = useTranslations();
  // DatetimeUtc only reads its value on mount, so remount it on presets
  const [presetCount, setPresetCount] = useState(0);
  const { range_min, range_max } = scaling;

  // presets never extend past the question's range
  const clampToRange = ([low, high]: [string, string]): [string, string] => {
    const clamp = (bound: string) => {
      const location = toScaledLocation(bound, questionType);
      if (range_min !== null && location < range_min) {
        return fromScaledLocation(range_min, questionType);
      }
      if (range_max !== null && location > range_max) {
        return fromScaledLocation(range_max, questionType);
      }
      return bound;
    };
    return [clamp(low), clamp(high)];
  };

  const presets: { label: string; bounds: () => [string, string] | null }[] =
    questionType === QuestionType.Numeric
      ? [
          {
            label: "±0.5",
            bounds: () => {
              const value = Number(resolutionValue);
              if (!resolutionValue || isNaN(value)) return null;
              return [String(value - 0.5), String(value + 0.5)];
            },
          },
        ]
      : (
          [
            ["day", t("rangeResolutionPresetDay")],
            ["month", t("rangeResolutionPresetMonth")],
            ["year", t("rangeResolutionPresetYear")],
          ] as const
        ).map(([unit, label]) => ({
          label,
          bounds: () => {
            const bounds = resolutionValue
              ? getCalendarUnitBounds(resolutionValue, unit)
              : null;
            return bounds ? [bounds.lower, bounds.upper] : null;
          },
        }));

  return (
    <div className="flex flex-col gap-1 self-stretch text-left">
      <Checkbox
        checked={enabled}
        onChange={onEnabledChange}
        label={t("rangeResolutionToggle")}
        className="items-start"
        inputClassName="text-gray-900 dark:text-gray-900-dark"
      />
      <p className="m-0 pl-7 text-sm text-gray-700 dark:text-gray-700-dark">
        {t("rangeResolutionHelp")}
      </p>
      {enabled && (
        <div className="flex flex-col gap-2 pl-7 pt-1">
          <div className="flex flex-wrap gap-2">
            {presets.map(({ label, bounds }) => (
              <Button
                key={label}
                type="button"
                size="xs"
                variant="tertiary"
                disabled={!resolutionValue}
                onClick={() => {
                  const result = bounds();
                  if (result) {
                    onBoundsChange(...clampToRange(result));
                    setPresetCount((count) => count + 1);
                  }
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          {questionType === QuestionType.Numeric ? (
            <>
              <label className="flex flex-col gap-1 text-sm">
                {t("rangeResolutionLowerBound")}
                <Input
                  type="number"
                  step="any"
                  className="max-w-xs bg-transparent"
                  min={range_min ?? undefined}
                  max={range_max ?? undefined}
                  value={lower ?? ""}
                  onChange={(event) =>
                    onBoundsChange(event.target.value, upper)
                  }
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {t("rangeResolutionUpperBound")}
                <Input
                  type="number"
                  step="any"
                  className="max-w-xs bg-transparent"
                  min={range_min ?? undefined}
                  max={range_max ?? undefined}
                  value={upper ?? ""}
                  onChange={(event) =>
                    onBoundsChange(lower, event.target.value)
                  }
                />
              </label>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-sm">
                {t("rangeResolutionLowerBound")}
                <DatetimeUtc
                  key={`lower-${presetCount}`}
                  className="bg-transparent pl-1"
                  defaultValue={lower}
                  onChange={(value) => onBoundsChange(value, upper)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {t("rangeResolutionUpperBound")}
                <DatetimeUtc
                  key={`upper-${presetCount}`}
                  className="bg-transparent pl-1"
                  defaultValue={upper}
                  onChange={(value) => onBoundsChange(lower, value)}
                />
              </label>
            </>
          )}
          {error && (
            <p className="m-0 text-sm text-red-500 dark:text-red-500-dark">
              {t(error)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ResolutionRangeInputs;
