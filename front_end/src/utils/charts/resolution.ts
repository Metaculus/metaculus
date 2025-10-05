import { isNil } from "lodash";

import { LinePoint } from "@/types/charts";
import { Resolution } from "@/types/post";
import {
  AggregateForecast,
  Question,
  QuestionType,
  Scaling,
} from "@/types/question";
import { unscaleNominalLocation } from "@/utils/math";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

function numericOobOffset(s: Scaling): number {
  const min = s.range_min ?? 0;
  const max = s.range_max ?? 1;
  const span = Math.abs(max - min) || 1;
  return span * 0.02;
}

export function getResolutionPoint({
  questionType,
  resolution,
  resolveTime,
  scaling,
  inboundOutcomeCount,
  lastAggregation,
  size,
}: {
  questionType: QuestionType;
  resolution: Resolution;
  resolveTime: number;
  scaling: Scaling;
  inboundOutcomeCount?: number | null;
  lastAggregation?: AggregateForecast;
  size?: number;
}): LinePoint | null {
  if (isUnsuccessfullyResolved(resolution)) {
    return null;
  }
  switch (questionType) {
    case QuestionType.Binary: {
      // format data for binary question
      return {
        y: lastAggregation
          ? (lastAggregation.centers?.[0] as number)
          : resolution === "no"
            ? scaling.range_min ?? 0
            : scaling.range_max ?? 1,
        x: resolveTime,
        symbol: "diamond",
        size: size ?? 4,
      };
    }
    case QuestionType.Date: {
      let rawSec: number | undefined;

      if (typeof resolution === "string") {
        if (resolution === "below_lower_bound") {
          rawSec = (scaling.range_min ?? 0) - numericOobOffset(scaling);
        } else if (resolution === "above_upper_bound") {
          rawSec = (scaling.range_max ?? 1) + numericOobOffset(scaling);
        } else {
          const n = Number(resolution);
          if (Number.isFinite(n)) {
            rawSec = n > 1e12 ? n / 1000 : n;
          } else {
            const d = new Date(resolution);
            const ms = d.getTime();
            if (Number.isFinite(ms)) rawSec = ms / 1000;
          }
        }
      } else if (
        typeof resolution === "number" &&
        Number.isFinite(resolution)
      ) {
        rawSec = resolution;
      }

      if (!Number.isFinite(rawSec as number)) return null;
      const y = unscaleNominalLocation(rawSec as number, scaling);
      if (!Number.isFinite(y)) return null;
      return { y, x: resolveTime, symbol: "diamond", size: size ?? 4 };
    }
    case QuestionType.Numeric: {
      let raw: number | undefined;

      if (typeof resolution === "number" && Number.isFinite(resolution)) {
        raw = resolution;
      } else if (typeof resolution === "string") {
        if (resolution === "below_lower_bound") {
          raw = (scaling.range_min ?? 0) - numericOobOffset(scaling);
        } else if (resolution === "above_upper_bound") {
          raw = (scaling.range_max ?? 1) + numericOobOffset(scaling);
        } else {
          const n = Number(resolution);
          if (Number.isFinite(n)) raw = n;
        }
      }

      if (!Number.isFinite(raw as number)) {
        const c = lastAggregation?.centers?.[0] as number | undefined;
        if (Number.isFinite(c)) raw = c as number;
        else return null;
      }

      const y = unscaleNominalLocation(raw as number, scaling);
      if (!Number.isFinite(y)) return null;

      return { y, x: resolveTime, symbol: "diamond", size: size ?? 4 };
    }
    case QuestionType.Discrete: {
      const step =
        inboundOutcomeCount && inboundOutcomeCount > 0
          ? 1 / inboundOutcomeCount
          : 0;

      if (resolution === "below_lower_bound") {
        return {
          y: step ? -0.5 * step : 0,
          x: resolveTime,
          symbol: "diamond",
          size: size ?? 4,
        };
      }
      if (resolution === "above_upper_bound") {
        return {
          y: step ? 1 + 0.5 * step : 1,
          x: resolveTime,
          symbol: "diamond",
          size: size ?? 4,
        };
      }

      const n = Number(resolution);
      if (!Number.isFinite(n)) return null;
      let y = unscaleNominalLocation(n, scaling);

      if (y <= 0) y = step ? -0.5 * step : 0;
      else if (y >= 1) y = step ? 1 + 0.5 * step : 1;

      return { y, x: resolveTime, symbol: "diamond", size: size ?? 4 };
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

export function getPlacementForY(
  y: number | null | undefined,
  yDomain: [number, number]
): "in" | "below" | "above" {
  if (y == null) return "in";
  const [yMin, yMax] = yDomain;
  if (y < yMin) return "below";
  if (y > yMax) return "above";
  return "in";
}
