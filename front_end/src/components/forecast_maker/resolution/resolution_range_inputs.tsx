"use client";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { Input } from "@/components/ui/form_field";
import { QuestionType } from "@/types/question";

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

type Props = {
  questionType: QuestionType.Numeric | QuestionType.Date;
  resolutionValue?: string;
  enabled: boolean;
  lower?: string;
  upper?: string;
  onEnabledChange: (enabled: boolean) => void;
  onBoundsChange: (lower?: string, upper?: string) => void;
};

const ResolutionRangeInputs: FC<Props> = ({
  questionType,
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
                    onBoundsChange(...result);
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
        </div>
      )}
    </div>
  );
};

export default ResolutionRangeInputs;
