import { isNil } from "lodash";

import { LinePoint } from "@/types/charts";
import { Resolution } from "@/types/post";
import { Question, QuestionType, Scaling } from "@/types/question";
import { unscaleNominalLocation } from "@/utils/math";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

export function getResolutionPoint({
  questionType,
  resolution,
  resolveTime,
  scaling,
  inboundOutcomeCount,
}: {
  questionType: QuestionType;
  resolution: Resolution;
  resolveTime: number;
  scaling: Scaling;
  inboundOutcomeCount?: number | null;
}): LinePoint | null {
  if (isUnsuccessfullyResolved(resolution)) {
    return null;
  }
  switch (questionType) {
    case QuestionType.Binary: {
      // format data for binary question
      console.log(resolveTime);
      return {
        y:
          resolution === "no" ? scaling.range_min ?? 0 : scaling.range_max ?? 1,
        x: resolveTime,
        symbol: "diamond",
        size: 4,
      };
    }
    case QuestionType.Date: {
      // format data for date question
      const dateTimestamp = new Date(resolution).getTime() / 1000;
      const unscaledResolution = unscaleNominalLocation(dateTimestamp, scaling);

      return {
        y: unscaledResolution,
        x: resolveTime,
        symbol: "diamond",
        size: 4,
      };
    }
    case QuestionType.Numeric: {
      // format data for numerical question
      const unscaledResolution = unscaleNominalLocation(
        Number(resolution),
        scaling
      );
      return {
        y: unscaledResolution,
        x: resolveTime,
        symbol: "diamond",
        size: 4,
      };
    }
    case QuestionType.Discrete: {
      // format data for discrete question
      let unscaledResolution = unscaleNominalLocation(
        Number(resolution),
        scaling
      );
      if (resolution === "below_lower_bound" || unscaledResolution <= 0) {
        unscaledResolution = inboundOutcomeCount
          ? -0.5 / inboundOutcomeCount
          : 0;
      }
      if (resolution === "above_upper_bound" || unscaledResolution >= 1) {
        unscaledResolution = inboundOutcomeCount
          ? 1 + 0.5 / inboundOutcomeCount
          : 1;
      }

      return {
        y: unscaledResolution,
        x: resolveTime,
        symbol: "diamond",
        size: 4,
      };
    }
    default:
      return null;
  }
}

export function getResolutionPosition({
  question,
  scaling,
  adjustBinaryPoint = false,
}: {
  question: Question;
  scaling: Scaling;
  adjustBinaryPoint?: boolean;
}) {
  const resolution = question.resolution;
  if (isNil(resolution)) {
    // fallback, usually we don't expect this, as function will be called only for resolved questions
    return 0;
  }
  if (adjustBinaryPoint && ["no", "yes"].includes(resolution as string)) {
    return 0.4;
  }
  if (
    ["no", "below_lower_bound", "annulled", "ambiguous"].includes(
      resolution as string
    )
  ) {
    return 0;
  } else if (["yes", "above_upper_bound"].includes(resolution as string)) {
    return 1;
  } else {
    return question.type === QuestionType.Numeric ||
      question.type === QuestionType.Discrete
      ? unscaleNominalLocation(Number(resolution), scaling)
      : unscaleNominalLocation(new Date(resolution).getTime() / 1000, scaling);
  }
}
