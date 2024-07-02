import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostConditional, PostStatus } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";

import ConditionalCard from "./conditional_card";
import ConditionalChart from "./conditional_chart";
import Arrow from "./icons/Arrow";
import DisabledArrow from "./icons/DisabledArrow";

type Props = {
  conditional: PostConditional<QuestionWithForecasts>;
  curationStatus: PostStatus;
};

const ConditionalTile: FC<Props> = ({ conditional, curationStatus }) => {
  const t = useTranslations();

  const { condition, question_yes, question_no } = conditional;

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
      <div className="col-span-2 row-span-1 flex flex-col justify-center md:col-span-1 md:row-auto">
        <ConditionalCard
          label="Condition"
          title={condition.title}
          resolved={parentSuccessfullyResolved}
        />
      </div>
      <div className="relative row-span-2 ml-3 flex flex-col justify-start gap-0 md:row-auto md:ml-0 md:justify-center md:gap-12">
        <ConditionalArrow
          label={t("arrowIfNo")}
          didHappen={yesHappened}
          disabled={yesDisabled}
          className="flex-1 md:flex-none"
        />
        <ConditionalArrow
          label={t("arrowIfYes")}
          didHappen={noHappened}
          disabled={noDisabled}
          className="flex-1 md:flex-none"
        />
        <div className="absolute left-0 top-0 h-3/4 w-[1px] bg-blue-700 dark:bg-blue-700-dark md:hidden" />
      </div>
      <div className="row-span-2 flex flex-col gap-3 md:row-auto">
        <ConditionalCard title={question_yes.title}>
          <ConditionalChart
            parentResolved={parentSuccessfullyResolved}
            question={question_yes}
            disabled={yesDisabled}
            parentStatus={curationStatus}
          />
        </ConditionalCard>
        <ConditionalCard title={question_no.title}>
          <ConditionalChart
            parentResolved={parentSuccessfullyResolved}
            question={question_no}
            disabled={noDisabled}
            parentStatus={curationStatus}
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
        "relative flex items-center justify-center",
        className
      )}
    >
      <div className={classNames("absolute w-full", { "md:px-1": !disabled })}>
        {disabled ? <DisabledArrow /> : <Arrow />}
      </div>

      <span
        className={classNames(
          "z-[2] bg-gray-0 px-1 text-xs font-semibold uppercase dark:bg-gray-0-dark",
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
