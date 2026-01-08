import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { FC, RefObject } from "react";

import ReaffirmButton from "@/components/post_card/reaffirm_button";
import { ChoiceItem } from "@/types/choices";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";

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
  withChoiceIcon?: boolean;
  layout?: "column" | "wrap";
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
  withChoiceIcon = true,
  layout = "column",
}) => {
  const t = useTranslations();

  const visibleChoices = choices.slice(0, visibleChoicesCount);
  const otherItemsCount = choices.length - visibleChoices.length;
  const isWrap = layout === "wrap";

  return (
    <div
      ref={ref}
      className={cn(
        isWrap
          ? "flex flex-row flex-wrap gap-x-4 gap-y-2"
          : "embed-gap flex flex-col gap-2.5"
      )}
    >
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
          <div
            key={`choice-option-${choice}`}
            className={cn(isWrap && "min-w-0 flex-none overflow-hidden")}
          >
            <ChoiceOption
              choice={choice}
              color={color}
              values={hideCP ? [null as unknown as number] : aggregationValues}
              resolution={resolution}
              displayedResolution={displayedResolution}
              questionType={questionType}
              scaling={scaling}
              labelClassName={optionLabelClassName}
              actual_resolve_time={actual_resolve_time}
              withIcon={withChoiceIcon}
            />
          </div>
        )
      )}

      {otherItemsCount > 0 && (
        <div
          className={cn(
            "flex flex-row items-center justify-between text-gray-600 dark:text-gray-600-dark",
            isWrap && "col-span-2"
          )}
        >
          <div className="flex flex-row items-center">
            <div
              className={cn(
                "self-center py-0 pr-3.5 text-center leading-none",
                layout === "wrap" && "h-4 pr-3"
              )}
            >
              <FontAwesomeIcon
                icon={faEllipsis}
                size="xs"
                className={cn(
                  "resize-ellipsis w-[10px]",
                  layout === "wrap" && "h-4"
                )}
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
        <div className={cn(isWrap && "col-span-2")}>
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
