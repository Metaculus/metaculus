import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import { ChoiceItem } from "@/types/choices";
import { QuestionType } from "@/types/question";
import cn from "@/utils/cn";

import ChoiceOption from "./choice_option";

type Props = {
  choices: ChoiceItem[];
  visibleChoicesCount: number;
  questionType?: QuestionType;
  hideCP?: boolean;
  hideChoiceIcon?: boolean;
  optionLabelClassName?: string;
  onReaffirm?: () => void;
  canPredict?: boolean;
};

const MultipleChoiceTileLegend: FC<Props> = ({
  choices,
  visibleChoicesCount,
  hideCP,
  questionType,
  hideChoiceIcon,
  optionLabelClassName,
  onReaffirm,
  canPredict = false,
}) => {
  const t = useTranslations();

  const visibleChoices = choices.slice(0, visibleChoicesCount);
  const otherItemsCount = choices.length - visibleChoices.length;

  return (
    <div className="embed-gap flex flex-col gap-2">
      {visibleChoices.map(
        ({
          choice,
          color,
          aggregationValues,
          resolution,
          displayedResolution,
          scaling,
        }) => (
          <ChoiceOption
            key={`choice-option-${choice}`}
            choice={choice}
            color={color}
            values={hideCP ? [null as unknown as number] : aggregationValues}
            resolution={resolution}
            displayedResolution={displayedResolution}
            questionType={questionType}
            scaling={scaling}
            hideIcon={hideChoiceIcon}
            labelClassName={optionLabelClassName}
          />
        )
      )}
      {otherItemsCount > 0 && (
        <div className="flex flex-row text-gray-600 dark:text-gray-600-dark">
          <div className="self-center py-0 pr-1.5 text-center">
            <FontAwesomeIcon
              icon={faEllipsis}
              size="xl"
              className="resize-ellipsis"
            />
          </div>
          <div className="resize-label whitespace-nowrap px-1.5 py-0.5 text-left text-sm font-medium leading-4">
            {t("otherWithCount", { count: otherItemsCount })}
          </div>
          {canPredict && !!onReaffirm && (
            <ReaffirmButton onReaffirm={onReaffirm} combined />
          )}
        </div>
      )}
      {!otherItemsCount && canPredict && !!onReaffirm && (
        <ReaffirmButton onReaffirm={onReaffirm} />
      )}
    </div>
  );
};

const ReaffirmButton: FC<{ onReaffirm: () => void; combined?: boolean }> = ({
  onReaffirm,
  combined = false,
}) => {
  const t = useTranslations();

  return (
    <button
      className={cn(
        "resize-label flex py-0.5 text-left text-sm font-medium leading-4 text-orange-700 underline hover:text-orange-600 dark:text-orange-700 dark:hover:text-orange-600-dark",
        { lowercase: combined }
      )}
      onClick={(e) => {
        // prevent navigation, e.g. when rendered inside Next.js Link
        e.stopPropagation();
        e.nativeEvent.preventDefault();
        e.nativeEvent.stopImmediatePropagation();

        onReaffirm();
      }}
    >
      {combined ? `(${t("reaffirm")})` : t("reaffirm")}
    </button>
  );
};

export default MultipleChoiceTileLegend;
