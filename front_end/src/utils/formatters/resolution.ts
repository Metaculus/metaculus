import { isValid } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { capitalize } from "lodash";

import { QuestionType, Scaling } from "@/types/question";
import { formatDate } from "@/utils/formatters/date";
import { abbreviatedNumber } from "@/utils/formatters/number";
import {
  getPredictionDisplayValue,
  getQuestionDateFormatString,
} from "@/utils/formatters/prediction";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";
import { formatValueUnit } from "@/utils/questions/units";

export function formatResolution({
  resolution,
  questionType,
  locale,
  actual_resolve_time,
  scaling,
  unit,
  completeBounds = false,
  longBounds = false,
  sigfigs,
}: {
  resolution: number | string | null | undefined;
  questionType: QuestionType;
  locale: string;
  actual_resolve_time: string | null;
  scaling?: Scaling;
  unit?: string;
  completeBounds?: boolean;
  longBounds?: boolean;
  sigfigs?: number;
}) {
  if (resolution === null || resolution === undefined) {
    return "-";
  }

  resolution = String(resolution);

  if (["yes", "no"].includes(resolution)) {
    return capitalize(resolution);
  }

  if (isUnsuccessfullyResolved(resolution)) {
    return capitalize(resolution);
  }

  if (resolution === "below_lower_bound") {
    if (completeBounds && scaling) {
      return getPredictionDisplayValue(0, {
        questionType,
        scaling,
        actual_resolve_time,
        unit,
        precision: 10,
        longBounds,
      });
    }
    return "Below lower bound";
  }
  if (resolution === "above_upper_bound") {
    if (completeBounds && scaling) {
      return getPredictionDisplayValue(1, {
        questionType,
        scaling,
        actual_resolve_time,
        unit,
        precision: 10,
        longBounds,
      });
    }
    return "Above upper bound";
  }

  if (questionType === QuestionType.Date) {
    if (!isNaN(Number(resolution)) && resolution.trim() !== "") {
      const date = new Date(Number(resolution));
      if (isValid(date)) {
        const formattedDate = scaling
          ? formatInTimeZone(
              date,
              "UTC",
              getQuestionDateFormatString({
                scaling,
                actual_resolve_time,
                valueTimestamp: date.getTime() / 1000,
              })
            )
          : formatDate(locale, date);
        return `${formattedDate} UTC`;
      }
      return resolution;
    }

    const date = new Date(resolution);
    if (isValid(date)) {
      const formattedDate = scaling
        ? formatInTimeZone(
            date,
            "UTC",
            getQuestionDateFormatString({
              scaling,
              actual_resolve_time,
              valueTimestamp: date.getTime() / 1000,
            })
          )
        : formatDate(locale, date);
      return `${formattedDate} UTC`;
    }
    return resolution;
  }

  if (!isNaN(Number(resolution)) && resolution.trim() !== "") {
    return formatValueUnit(
      abbreviatedNumber(Number(resolution), sigfigs ?? 10, false),
      unit
    );
  }

  if (questionType === QuestionType.MultipleChoice) {
    return resolution;
  }

  return resolution;
}

export function formatMultipleChoiceResolution(
  resolution: number | string | null | undefined,
  choice: string,
  showNoResolutions: boolean = true
) {
  if (resolution === null || resolution === undefined) {
    return "-";
  }

  resolution = String(resolution);

  if (isUnsuccessfullyResolved(resolution)) {
    return capitalize(resolution);
  }

  return choice.toLowerCase() === resolution.toLowerCase()
    ? "Yes"
    : showNoResolutions
      ? "No"
      : null;
}
