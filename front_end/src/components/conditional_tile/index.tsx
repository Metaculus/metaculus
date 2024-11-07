"use client";

import { sendGAEvent } from "@next/third-parties/google";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useEffect } from "react";
import { VictoryThemeDefinition } from "victory";

import Button from "@/app/(main)/about/components/Button";
import { useHideCP } from "@/app/(main)/questions/[id]/components/cp_provider";
import { SLUG_POST_SUB_QUESTION_ID } from "@/app/(main)/questions/[id]/search_params";
import PredictionChip from "@/components/prediction_chip";
import { PostConditional, PostStatus } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import {
  getConditionalQuestionTitle,
  getConditionTitle,
  isUnsuccessfullyResolved,
} from "@/utils/questions";

import ConditionalCard from "./conditional_card";
import ConditionalChart from "./conditional_chart";
import Arrow from "./icons/Arrow";
import DisabledArrow from "./icons/DisabledArrow";

type Props = {
  postTitle: string;
  conditional: PostConditional<QuestionWithForecasts>;
  curationStatus: PostStatus;
  withNavigation?: boolean;
  chartTheme?: VictoryThemeDefinition;
  nrForecasters?: number;
  withCPRevealBtn?: boolean;
};

const ConditionalTile: FC<Props> = ({
  postTitle,
  conditional,
  curationStatus,
  withNavigation,
  chartTheme,
  withCPRevealBtn,
}) => {
  const t = useTranslations();
  const { hideCP, setCurrentHideCP } = useHideCP();
  const { condition, condition_child, question_yes, question_no } = conditional;
  const isEmbedded = !!chartTheme;

  const conditionHref =
    condition.id === condition.post_id
      ? `/questions/${condition.id}`
      : `/questions/${condition.post_id}?${SLUG_POST_SUB_QUESTION_ID}=${condition.id}`;
  const conditionChildHref =
    condition_child.id === condition_child.post_id
      ? `/questions/${condition_child.id}`
      : `/questions/${condition_child.post_id}?${SLUG_POST_SUB_QUESTION_ID}=${condition_child.id}`;

  const parentSuccessfullyResolved =
    condition.resolution === "yes" || condition.resolution === "no";
  const parentIsClosed = condition.actual_close_time
    ? new Date(condition.actual_close_time).getTime() < Date.now()
    : false;
  const yesHappened = condition.resolution === "yes";
  const yesDisabled = isUnsuccessfullyResolved(question_yes.resolution);
  const noHappened = condition.resolution === "no";
  const noDisabled = isUnsuccessfullyResolved(question_no.resolution);

  useEffect(() => {
    if (
      !!question_no.my_forecasts?.history.length ||
      !!question_yes.my_forecasts?.history.length
    ) {
      sendGAEvent("event", "visitPredictedQuestion", {
        event_category: "conditional",
      });
    }
  }, [
    question_no.my_forecasts?.history.length,
    question_yes.my_forecasts?.history.length,
  ]);

  return (
    <>
      <div className="ConditionalSummary grid grid-cols-[72px_minmax(0,_1fr)] gap-y-3 md:grid-cols-[minmax(0,_1fr)_72px_minmax(0,_1fr)]">
        <div
          className={classNames(
            "ConditionalSummary-condition col-span-2 flex flex-col justify-center",
            {
              "row-span-1 md:col-span-1 md:row-auto": !isEmbedded,
              "xs:col-span-1": isEmbedded,
            }
          )}
        >
          <ConditionalCard
            label={t("condition")}
            title={getConditionTitle(postTitle, condition)}
            resolved={parentSuccessfullyResolved}
            href={withNavigation ? conditionHref : undefined}
          >
            {(parentSuccessfullyResolved || parentIsClosed) && (
              <PredictionChip
                question={condition}
                status={
                  parentSuccessfullyResolved
                    ? PostStatus.RESOLVED
                    : PostStatus.CLOSED
                }
                size="compact"
                hideCP={hideCP}
              />
            )}
          </ConditionalCard>
        </div>
        <div
          className={classNames(
            "ConditionalSummary-arrows relative flex flex-col justify-start gap-0 md:row-auto md:justify-center md:gap-12",
            { "row-span-2 ml-3 md:ml-0": !isEmbedded }
          )}
        >
          <ConditionalArrow
            label={t("ifYes")}
            didHappen={yesHappened}
            disabled={yesDisabled}
            className={"flex-1 md:flex-none"}
          />
          <ConditionalArrow
            label={t("ifNo")}
            didHappen={noHappened}
            disabled={noDisabled}
            className={"flex-1 md:flex-none"}
          />

          <div
            className={classNames(
              "absolute left-0 top-0 h-3/4 w-px bg-blue-700 dark:bg-blue-700-dark md:hidden",
              { "xs:hidden": isEmbedded }
            )}
          />
        </div>
        <div
          className={classNames(
            "ConditionalSummary-conditionals flex flex-col gap-3",
            { "row-span-2 md:row-auto": !isEmbedded }
          )}
        >
          <ConditionalCard
            title={getConditionalQuestionTitle(question_yes)}
            href={withNavigation ? conditionChildHref : undefined}
          >
            <ConditionalChart
              question={question_yes}
              disabled={yesDisabled}
              chartTheme={chartTheme}
              hideCP={hideCP}
            />
          </ConditionalCard>
          <ConditionalCard
            title={getConditionalQuestionTitle(question_no)}
            href={withNavigation ? conditionChildHref : undefined}
          >
            <ConditionalChart
              question={question_no}
              disabled={noDisabled}
              chartTheme={chartTheme}
              hideCP={hideCP}
            />
          </ConditionalCard>
        </div>
      </div>
      {withCPRevealBtn && hideCP && (
        <div className="text-center">
          <div className="text-l m-4">{t("CPIsHidden")}</div>
          <Button onClick={() => setCurrentHideCP(false)}>
            {t("RevealTemporarily")}
          </Button>
        </div>
      )}
    </>
  );
};

const ConditionalArrow: FC<{
  label: string;
  didHappen: boolean;
  disabled: boolean;
  className?: string;
  labelClassName?: string;
}> = ({ label, disabled, didHappen, className }) => {
  return (
    <div
      className={classNames(
        "ConditionalSummary-conditional-arrow relative flex items-center justify-center",
        className
      )}
    >
      <div className={classNames("absolute w-full", { "md:px-1": !disabled })}>
        {disabled ? <DisabledArrow /> : <Arrow didHappen={didHappen} />}
      </div>

      <span
        className={classNames(
          "ConditionalSummary-conditional-label z-[2] bg-gray-0 px-1 text-xs font-semibold uppercase dark:bg-gray-0-dark",
          { "text-blue-500 dark:text-blue-600-dark": disabled },
          { "text-blue-900 dark:text-blue-900-dark": didHappen && !disabled },
          { "text-blue-700 dark:text-blue-700-dark": !didHappen && !disabled }
        )}
      >
        {label}
      </span>
    </div>
  );
};

export default ConditionalTile;
