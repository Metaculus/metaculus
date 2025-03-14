import { isNil } from "lodash";
import React, { FC } from "react";

import ChoiceIcon from "@/components/choice_icon";
import ResolutionIcon from "@/components/icons/resolution";
import { Resolution } from "@/types/post";
import { QuestionType, Scaling } from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { getChoiceOptionValue } from "@/utils/charts";
import cn from "@/utils/cn";

type Props = {
  choice: string;
  color: ThemeColor;
  values: (number | null)[];
  displayedResolution?: Resolution | null;
  resolution?: Resolution | null;
  questionType?: QuestionType;
  scaling?: Scaling;
  hideIcon?: boolean;
  labelClassName?: string;
  unit?: string;
};

const ChoiceOption: FC<Props> = ({
  choice,
  color,
  values,
  displayedResolution,
  resolution,
  questionType,
  scaling,
  hideIcon,
  labelClassName,
  unit,
}) => {
  return (
    <div
      key={`choice-option-${choice}`}
      className="flex h-auto flex-row items-center self-start sm:self-stretch"
    >
      {!hideIcon && (
        <div className="py-0.5 pr-1.5">
          <ChoiceIcon color={color} className="resize-icon" />
        </div>
      )}

      <div
        className={cn(
          "resize-label line-clamp-2 w-full py-0.5 pr-1.5 text-left text-sm font-medium leading-4 text-gray-900 dark:text-gray-900-dark",
          { "pl-1.5}": !hideIcon },
          labelClassName
        )}
      >
        {choice}
      </div>
      {isNil(resolution) ? (
        <div className="resize-label py-0.5 pr-1.5 text-right text-sm font-bold leading-4 text-gray-900 dark:text-gray-900-dark">
          {getChoiceOptionValue(
            values[values.length - 1] ?? null,
            questionType,
            scaling
          )}
        </div>
      ) : (
        <div className="resize-label flex items-center whitespace-nowrap px-1.5 py-0.5 text-right text-sm font-bold leading-4 text-purple-800 dark:text-purple-800-dark">
          <ResolutionIcon />
          {displayedResolution ?? resolution}
          {unit && ` ${unit}`}
        </div>
      )}
    </div>
  );
};

export default ChoiceOption;
