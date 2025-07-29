import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC, RefObject } from "react";

import ReaffirmButton from "@/components/post_card/reaffirm_button";
import { ChoiceItem } from "@/types/choices";
import { QuestionType } from "@/types/question";

import ChoiceOption from "./choice_option";

type Props = {
  choices: ChoiceItem[];
  visibleChoicesCount: number;
  questionType?: QuestionType;
  hideCP?: boolean;
  optionLabelClassName?: string;
  onReaffirm?: () => void;
  canPredict?: boolean;
  ref?: RefObject<HTMLDivElement | null>;
};

const MultipleChoiceTileLegend: FC<Props> = ({
  choices,
  visibleChoicesCount,
  hideCP,
  questionType,
  optionLabelClassName,
  onReaffirm,
  canPredict = false,
  ref,
}) => {
  const t = useTranslations();

  const visibleChoices = choices.slice(0, visibleChoicesCount);
  const otherItemsCount = choices.length - visibleChoices.length;

  return (
    <div className="embed-gap flex flex-col gap-2.5" ref={ref}>
      {visibleChoices.map(
        ({
          choice,
          color,
          aggregationValues,
          resolution,
          displayedResolution,
          scaling,
          actual_resolve_time,
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
            labelClassName={optionLabelClassName}
            actual_resolve_time={actual_resolve_time}
          />
        )
      )}
      {otherItemsCount > 0 && (
        <div className="flex flex-row items-center justify-between text-gray-600 dark:text-gray-600-dark">
          <div className="flex flex-row items-center">
            <div className="self-center py-0 pr-3.5 text-center leading-none">
              <FontAwesomeIcon
                icon={faEllipsis}
                size="xs"
                className="resize-ellipsis w-[10px]"
              />
            </div>
            <div className="resize-label whitespace-nowrap pr-1.5 text-left text-sm font-normal leading-4">
              {t("otherWithCount", { count: otherItemsCount })}
            </div>
          </div>
          {canPredict && !!onReaffirm && (
            <ReaffirmButton
              onClick={onReaffirm}
              className="resize-label flex text-left text-sm leading-4"
              all
            />
          )}
        </div>
      )}
      {!otherItemsCount && canPredict && !!onReaffirm && (
        <div>
          <ReaffirmButton
            onClick={onReaffirm}
            className="resize-label flex text-left text-sm leading-4"
            all
          />
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceTileLegend;
