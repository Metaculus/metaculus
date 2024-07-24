import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { VictoryThemeDefinition } from "victory";

import { SLUG_POST_SUB_QUESTION_ID } from "@/app/(main)/questions/[id]/search_params";
import { PostConditional, PostStatus } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import {
  getConditionalQuestionTitle,
  getConditionTitle,
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
};

const ConditionalTile: FC<Props> = ({
  postTitle,
  conditional,
  curationStatus,
  withNavigation,
  chartTheme,
}) => {
  const t = useTranslations();

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
    curationStatus === PostStatus.RESOLVED &&
    condition.resolution !== null &&
    condition.resolution === "yes";
  const yesHappened =
    condition.resolution !== null &&
    condition.resolution === question_yes.resolution;
  const yesDisabled =
    condition.resolution !== null &&
    condition.resolution !== question_yes.resolution;
  const noHappened =
    condition.resolution !== null &&
    condition.resolution === question_no.resolution;
  const noDisabled =
    condition.resolution !== null &&
    condition.resolution !== question_no.resolution;

  return (
    <div className="ConditionalSummary grid grid-cols-[72px_minmax(0,_1fr)] gap-y-3 md:grid-cols-[minmax(0,_1fr)_72px_minmax(0,_1fr)]">
      <div
        className={classNames(
          "ConditionalSummary-condition flex flex-col justify-center",
          { "col-span-2 row-span-1 md:col-span-1 md:row-auto": !isEmbedded }
        )}
      >
        <ConditionalCard
          label="Condition"
          title={getConditionTitle(postTitle, condition)}
          resolved={parentSuccessfullyResolved}
          href={withNavigation ? conditionHref : undefined}
        />
      </div>
      <div
        className={classNames(
          "ConditionalSummary-arrows relative flex flex-col justify-start gap-0 md:row-auto md:justify-center md:gap-12",
          { "row-span-2 ml-3 md:ml-0": !isEmbedded }
        )}
      >
        <ConditionalArrow
          label={t("arrowIfNo")}
          didHappen={yesHappened}
          disabled={yesDisabled}
          className={!isEmbedded ? "flex-1 md:flex-none" : undefined}
        />
        <ConditionalArrow
          label={t("arrowIfYes")}
          didHappen={noHappened}
          disabled={noDisabled}
          className={!isEmbedded ? "flex-1 md:flex-none" : undefined}
        />
        {!isEmbedded && (
          <div className="absolute left-0 top-0 h-3/4 w-[1px] bg-blue-700 dark:bg-blue-700-dark md:hidden" />
        )}
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
            parentResolved={parentSuccessfullyResolved}
            question={question_yes}
            disabled={yesDisabled}
            parentStatus={curationStatus}
            chartTheme={chartTheme}
          />
        </ConditionalCard>
        <ConditionalCard
          title={getConditionalQuestionTitle(question_no)}
          href={withNavigation ? `/questions/${condition_child.id}` : undefined}
        >
          <ConditionalChart
            parentResolved={parentSuccessfullyResolved}
            question={question_no}
            disabled={noDisabled}
            parentStatus={curationStatus}
            chartTheme={chartTheme}
          />
        </ConditionalCard>
      </div>
    </div>
  );
};

const ConditionalArrow: FC<{
  label: string;
  didHappen: boolean;
  disabled: boolean;
  className?: string;
}> = ({ label, disabled, didHappen, className }) => {
  return (
    <div
      className={classNames(
        "ConditionalSummary-conditional-arrow relative flex items-center justify-center",
        className
      )}
    >
      <div className={classNames("absolute w-full", { "md:px-1": !disabled })}>
        {disabled ? <DisabledArrow /> : <Arrow />}
      </div>

      <span
        className={classNames(
          "ConditionalSummary-conditional-label z-[2] bg-gray-0 px-1 text-xs font-semibold uppercase dark:bg-gray-0-dark",
          didHappen
            ? "text-blue-900 dark:text-blue-900-dark"
            : "text-blue-700 dark:text-blue-700-dark"
        )}
      >
        {label}
      </span>
    </div>
  );
};

export default ConditionalTile;
