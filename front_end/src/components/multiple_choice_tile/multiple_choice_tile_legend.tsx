import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import { ChoiceItem } from "@/types/choices";
import { QuestionType } from "@/types/question";

import ChoiceOption from "./choice_option";

type Props = {
  choices: ChoiceItem[];
  visibleChoicesCount: number;
  questionType?: QuestionType;
  hideCP?: boolean;
  hideChoiceIcon?: boolean;
  optionLabelClassName?: string;
};

const MultipleChoiceTileLegend: FC<Props> = ({
  choices,
  visibleChoicesCount,
  hideCP,
  questionType,
  hideChoiceIcon,
  optionLabelClassName,
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
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceTileLegend;
