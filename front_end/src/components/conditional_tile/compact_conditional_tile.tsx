"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import CoherencePredictionTile from "@/app/(main)/questions/components/coherence_links/coherence_prediction_tile";
import UpcomingCP from "@/components/consumer_post_card/upcoming_cp";
import PredictionChip from "@/components/prediction_chip";
import { useHideCP } from "@/contexts/cp_context";
import { ConditionalPost, PostStatus, QuestionStatus } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import cn from "@/utils/core/cn";
import { getQuestionForecastAvailability } from "@/utils/questions/forecastAvailability";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

import ConditionalCard from "./conditional_card";

type BranchState = "open" | "happened" | "disabled";

type Props = {
  post: ConditionalPost<QuestionWithNumericForecasts>;
  colorOverride?: string;
};

/**
 * Condition on top, If Yes / If No side by side below it. Used where the full
 * ConditionalTile is too wide: consumer feed cards and embeds.
 */
const CompactConditionalTile: FC<Props> = ({ post, colorOverride }) => {
  const t = useTranslations();
  const { hideCP } = useHideCP();
  const { condition, question_yes, question_no } = post.conditional;

  const conditionResolved =
    condition.resolution === "yes" || condition.resolution === "no";
  const conditionClosed = condition.status === QuestionStatus.CLOSED;

  const getBranchState = (
    question: QuestionWithNumericForecasts,
    resolution: "yes" | "no"
  ): BranchState => {
    if (isUnsuccessfullyResolved(question.resolution)) return "disabled";
    return condition.resolution === resolution ? "happened" : "open";
  };

  const yesState = getBranchState(question_yes, "yes");
  const noState = getBranchState(question_no, "no");
  const branches = [
    { label: t("ifYes"), question: question_yes, state: yesState },
    { label: t("ifNo"), question: question_no, state: noState },
  ];

  return (
    <div className="flex w-full min-w-0 flex-col">
      <ConditionalCard
        label={t("condition")}
        title={condition.short_title || condition.title}
        resolved={conditionResolved}
        compact
      >
        {(conditionResolved || conditionClosed) && (
          <PredictionChip
            question={condition}
            status={conditionResolved ? PostStatus.RESOLVED : PostStatus.CLOSED}
            size="compact"
            hideCP={hideCP}
          />
        )}
      </ConditionalCard>

      <div aria-hidden className="flex flex-col items-center">
        <div
          className={cn(
            "h-2.5 w-px",
            conditionResolved
              ? "bg-blue-900 dark:bg-blue-900-dark"
              : "bg-blue-700 dark:bg-blue-700-dark"
          )}
        />
        <div className="grid h-2.5 w-1/2 grid-cols-2">
          <div className={cn("border-l border-t", BRANCH_LINE[yesState])} />
          <div className={cn("border-r border-t", BRANCH_LINE[noState])} />
        </div>
      </div>

      <div className="grid grid-cols-2">
        {branches.map(({ label, question, state }) => (
          <section
            key={question.id}
            aria-label={label}
            className="flex min-w-0 flex-col items-center gap-1.5 px-1 pt-1"
          >
            <span
              className={cn(
                "text-xs font-semibold uppercase",
                BRANCH_LABEL[state]
              )}
            >
              {label}
            </span>
            <BranchForecast
              question={question}
              hideCP={hideCP}
              colorOverride={colorOverride}
            />
          </section>
        ))}
      </div>
    </div>
  );
};

const BRANCH_LINE: Record<BranchState, string> = {
  open: "border-blue-700 dark:border-blue-700-dark",
  happened: "border-blue-900 dark:border-blue-900-dark",
  disabled: "border-dashed border-blue-500 dark:border-blue-300-dark",
};

const BRANCH_LABEL: Record<BranchState, string> = {
  open: "text-blue-700 dark:text-blue-700-dark",
  happened: "text-blue-900 dark:text-blue-900-dark",
  disabled: "text-blue-500 dark:text-blue-600-dark",
};

const BranchForecast: FC<{
  question: QuestionWithNumericForecasts;
  hideCP: boolean;
  colorOverride?: string;
}> = ({ question, hideCP, colorOverride }) => {
  const t = useTranslations();

  if (!question.resolution) {
    const { cpRevealsOn, isEmpty } = getQuestionForecastAvailability(question);
    if (cpRevealsOn) {
      return (
        <UpcomingCP
          cpRevealsOn={cpRevealsOn}
          className="text-xs text-olive-700 dark:text-olive-700-dark"
        />
      );
    }
    if (isEmpty) {
      return (
        <div className="text-center text-xs text-gray-600 dark:text-gray-600-dark">
          {t("noForecastsYet")}
        </div>
      );
    }
    // The binary gauge hides its own value; continuous values need hiding here.
    if (hideCP && question.type !== QuestionType.Binary) {
      return (
        <div className="text-lg font-bold text-gray-600 dark:text-gray-600-dark">
          {t("hidden")}
        </div>
      );
    }
  }

  return (
    <CoherencePredictionTile
      question={question}
      colorOverride={colorOverride}
    />
  );
};

export default CompactConditionalTile;
