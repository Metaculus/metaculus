import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC } from "react";

import ConditionalCard from "@/components/post_card/conditional/conditional_card";
import { PostConditional } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";

import Arrow from "./icons/Arrow";
import DisabledArrow from "./icons/DisabledArrow";

type Props = {
  conditional: PostConditional<QuestionWithForecasts>;
};

const ConditionalTile: FC<Props> = ({ conditional }) => {
  const t = useTranslations();

  const { condition, question_yes, question_no } = conditional;

  const parentSuccessfullyResolved =
    condition.resolution != null && condition.resolution === "yes";
  const yesHappened =
    condition.resolution != null &&
    condition.resolution == question_yes.resolution;
  const yesDisabled =
    condition.resolution != null &&
    condition.resolution !== question_yes.resolution;
  const noHappened =
    condition.resolution != null &&
    condition.resolution == question_no.resolution;
  const noDisabled =
    condition.resolution != null &&
    condition.resolution !== question_no.resolution;

  return (
    <div className="grid grid-cols-[minmax(0,_1fr)_72px_minmax(0,_1fr)]">
      <div className="flex flex-col justify-center">
        <ConditionalCard
          label="Condition"
          title={condition.title}
          resolved={parentSuccessfullyResolved}
        />
      </div>
      <div className="flex flex-col xs:justify-center xs:gap-12">
        <ConditionalArrow
          label={t("arrowIfNo")}
          didHappen={yesHappened}
          disabled={yesDisabled}
        />
        <ConditionalArrow
          label={t("arrowIfYes")}
          didHappen={noHappened}
          disabled={noDisabled}
        />
      </div>
      <div className="flex flex-col gap-3">
        <ConditionalCard title={question_yes.title}>
          TODO: chart {question_yes.type}
        </ConditionalCard>
        <ConditionalCard title={question_no.title}>
          TODO: chart {question_no.type}
        </ConditionalCard>
      </div>
    </div>
  );
};

const ConditionalArrow: FC<{
  label: string;
  didHappen: boolean;
  disabled: boolean;
}> = ({ label, disabled, didHappen }) => {
  return (
    <div className="relative flex items-center justify-center">
      <div className={classNames("absolute w-full", { "px-1": !disabled })}>
        {disabled ? <DisabledArrow /> : <Arrow />}
      </div>

      <span
        className={classNames(
          "z-10 bg-gray-0 px-1 text-xs font-semibold uppercase dark:bg-gray-0-dark",
          didHappen
            ? "text-blue-700 dark:text-blue-700-dark"
            : "text-blue-900 dark:text-blue-900-dark"
        )}
      >
        {label}
      </span>
    </div>
  );
};

export default ConditionalTile;
