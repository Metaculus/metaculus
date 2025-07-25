import { isNil, round } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";

import {
  CPMovement,
  MovementDirection,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";
import { TranslationKey } from "@/types/translations";
import cn from "@/utils/core/cn";
import { abbreviatedNumber } from "@/utils/formatters/number";
import { formatValueUnit } from "@/utils/questions/units";

import PeriodMovement from "./period_movement";

type Props = {
  question: QuestionWithForecasts;
  className?: string;
  presentation?: "forecasterView" | "consumerView";
  threshold?: number;
};

const QuestionCPMovement: FC<Props> = ({
  question,
  className,
  presentation,
  threshold = 0.01,
}) => {
  const t = useTranslations();

  const movement = question.aggregations?.recency_weighted?.movement;

  if (!movement || !movement.divergence || movement.divergence < threshold) {
    return null;
  }
  const movementComponents = getMovementComponents(question, movement, t);

  if (!movementComponents) {
    return null;
  }

  return (
    <PeriodMovement
      direction={movement.direction}
      message={t(getMovementPeriodMessage(Number(movement.period)), {
        value: formatValueUnit(
          movementComponents.amount.toString(),
          question?.type === QuestionType.Binary &&
            presentation == "consumerView"
            ? "%"
            : movementComponents.unit
        ),
      })}
      className={cn("text-xs", className)}
      iconClassName="text-xs"
    />
  );
};

export function getMovementPeriodMessage(period: number): TranslationKey {
  if (period <= 60 * 60) return "CPMovementHourChangeLabel";
  if (period <= 24 * 60 * 60) return "CPMovementDayChangeLabel";

  return "CPMovementWeekChangeLabel";
}

export function getMovementComponents(
  question: QuestionWithForecasts,
  cpMovement: CPMovement,
  t: ReturnType<typeof useTranslations>
):
  | {
      amount: number | string;
      unit: string;
      directionLabel: string;
    }
  | undefined {
  // Date questions
  if (question.type === QuestionType.Date) {
    const directionLabel =
      cpMovement.direction === MovementDirection.UP ? t("later") : t("sooner");
    // For date questions we receive movement in seconds so we need to convert it to days
    const movementInDays = (cpMovement.movement ?? 0) / (60 * 60 * 24);

    let amount = movementInDays;
    let unit = t("days");
    if (movementInDays > 730) {
      amount = round(movementInDays / 365, 1);
      unit = t("years");
    } else if (movementInDays <= 730 && movementInDays > 120) {
      amount = round(movementInDays / 30, 1);
      unit = t("months");
    } else if (movementInDays <= 120 && movementInDays > 21) {
      amount = round(movementInDays / 7, 1);
      unit = t("weeks");
    } else if (movementInDays <= 21) {
      amount = round(movementInDays, 1);
      unit = t("days");
    }
    if (
      [MovementDirection.UP, MovementDirection.DOWN].includes(
        cpMovement.direction
      )
    ) {
      // Median movement
      return {
        amount,
        unit: ` ${unit}`,
        directionLabel,
      };
    } else if (
      [MovementDirection.CONTRACTED, MovementDirection.EXPANDED].includes(
        cpMovement.direction
      )
    ) {
      const directionLabel =
        cpMovement.direction === MovementDirection.EXPANDED
          ? t("expanded")
          : t("narrowed");

      // Uncertainty movement
      return {
        amount,
        unit: ` ${unit}`,
        directionLabel,
      };
    }
  } else {
    // Numeric, binary and MC questions
    const directionLabel =
      cpMovement.direction === MovementDirection.UP
        ? t("increased")
        : t("decreased");
    const unit =
      question.type === QuestionType.Numeric
        ? isNil(question.unit)
          ? question.type
          : " " + question.unit
        : " " + t("percentagePoints");
    const amount =
      question.type === QuestionType.Numeric
        ? abbreviatedNumber(round(cpMovement.movement, 1)) // for numeric questions we receive already scaled value
        : round(cpMovement.movement * 100, 1); // for binary and MC questions we receive a percentage in 0-1 range
    if (
      [MovementDirection.UP, MovementDirection.DOWN].includes(
        cpMovement.direction
      )
    ) {
      // Median movement
      return {
        amount,
        unit,
        directionLabel,
      };
    } else if (
      [MovementDirection.CONTRACTED, MovementDirection.EXPANDED].includes(
        cpMovement.direction
      )
    ) {
      // Uncertainty movement
      const directionLabel =
        cpMovement.direction === MovementDirection.EXPANDED
          ? t("expanded")
          : t("narrowed");

      return {
        amount,
        unit,
        directionLabel,
      };
    }
  }
}

export default QuestionCPMovement;
