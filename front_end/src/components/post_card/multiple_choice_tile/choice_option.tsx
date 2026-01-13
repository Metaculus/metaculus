import { isNil } from "lodash";
import React, { FC } from "react";

import { useIsEmbedMode } from "@/app/(embed)/questions/components/question_view_mode_context";
import ChoiceIcon from "@/components/choice_icon";
import ChoiceResolutionIcon from "@/components/choice_resolution_icon";
import { Resolution } from "@/types/post";
import { QuestionType, Scaling } from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { findPreviousTimestamp } from "@/utils/charts/cursor";
import cn from "@/utils/core/cn";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";

type Props = {
  choice: string;
  color: ThemeColor;
  values: (number | null)[];
  displayedResolution?: Resolution | null;
  resolution?: Resolution | null;
  questionType?: QuestionType;
  scaling?: Scaling;
  labelClassName?: string;
  actual_resolve_time?: string | null;
  withIcon?: boolean;
  cursorTimestamp?: number | null;
  timestamps?: number[];
};

const ChoiceOption: FC<Props> = ({
  choice,
  color,
  values,
  displayedResolution,
  resolution,
  questionType,
  scaling,
  labelClassName,
  actual_resolve_time,
  cursorTimestamp = null,
  timestamps = [],
  withIcon = true,
}) => {
  const idx =
    cursorTimestamp == null || !timestamps?.length
      ? values.length - 1
      : Math.max(
          0,
          Math.min(
            timestamps.indexOf(
              findPreviousTimestamp(timestamps, cursorTimestamp)
            ),
            values.length - 1
          )
        );

  const valueAtCursor = values[idx];
  const resolutionWords = String(displayedResolution)?.split(" ");
  const adjustedResolution = resolutionWords.length
    ? resolutionWords
        .map((word, index) => {
          const outOfBoundsResolution = ["above", "below"].includes(
            resolutionWords[0]?.toLowerCase() ?? ""
          );
          if (
            (outOfBoundsResolution && index === 0) ||
            (!outOfBoundsResolution &&
              index === 1 &&
              // A small adjustment to keep date resolutions in one line
              String(displayedResolution).length > 15)
          ) {
            return word + "\n";
          }
          return word;
        })
        .join(" ")
    : resolution;

  const hasValue = !isNil(values.at(-1));
  const isEmbed = useIsEmbedMode();

  return (
    <div
      key={`choice-option-${choice}`}
      className={cn(
        "flex h-auto w-full min-w-0 flex-row items-center self-stretch text-gray-900 dark:text-gray-900-dark",
        {
          "text-gray-800 dark:text-gray-800-dark": !hasValue,
        },
        isEmbed && "pl-0.5"
      )}
    >
      {withIcon && (
        <div className="pr-3">
          <ChoiceIcon
            color={hasValue ? color : undefined}
            className="resize-icon size-3 rounded-full"
          />
        </div>
      )}

      <div
        className={cn(
          "resize-label min-w-0 flex-1 pr-2.5 text-left text-sm font-normal leading-4",
          isEmbed ? "truncate" : "line-clamp-2",
          labelClassName
        )}
      >
        {choice}
      </div>
      {isNil(resolution) ? (
        <div
          className={cn(
            "resize-label flex-shrink-0 text-right text-sm font-normal tabular-nums",
            {
              "opacity-30": !hasValue,
            },
            "leading-0"
          )}
        >
          {getPredictionDisplayValue(valueAtCursor, {
            questionType: questionType ?? QuestionType.Binary,
            scaling: scaling ?? {
              range_min: 0,
              range_max: 1,
              zero_point: null,
            },
            actual_resolve_time: actual_resolve_time ?? null,
            emptyLabel: "N/A",
          })}
        </div>
      ) : (
        <div className="resize-label leading-0 flex flex-shrink-0 items-center gap-0.5 whitespace-nowrap px-1.5 text-right text-sm font-medium tabular-nums">
          <ChoiceResolutionIcon
            color={questionType === QuestionType.Date ? color : undefined}
          />
          <div className="whitespace-pre text-right">{adjustedResolution}</div>
        </div>
      )}
    </div>
  );
};

export default ChoiceOption;
