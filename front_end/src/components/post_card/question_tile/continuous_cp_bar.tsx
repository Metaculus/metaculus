import { isNil } from "lodash";
import { FC } from "react";

import {
  useEmbedContainerWidth,
  useIsEmbedMode,
} from "@/app/(embed)/questions/components/question_view_mode_context";
import { QuestionStatus } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import { QuestionType } from "@/types/question";
import cn from "@/utils/core/cn";
import {
  getDiscreteValueOptions,
  getPredictionDisplayValue,
} from "@/utils/formatters/prediction";

type Props = {
  question: QuestionWithForecasts;
  size?: "md" | "lg";
  variant?: "feed" | "question";
  colorOverride?: string;
};

const ContinuousCPBar: FC<Props> = ({
  question,
  size = "md",
  variant = "feed",
  colorOverride,
}) => {
  const latest =
    question.aggregations[question.default_aggregation_method]?.latest;

  const isDate = question.type === QuestionType.Date;
  const isEmbed = useIsEmbedMode();
  const w = useEmbedContainerWidth();
  const isEmbedBelow376 = isEmbed && (w ?? 0) > 0 && (w ?? 0) < 376;
  const isEmbedWide = isEmbed && (w ?? 0) >= 500;

  if (!latest) {
    return null;
  }
  const discreteValueOptions = getDiscreteValueOptions(question);

  const displayValue = getPredictionDisplayValue(
    latest.centers?.[0],
    {
      questionType: question.type,
      scaling: question.scaling,
      range:
        !isNil(latest?.interval_lower_bounds?.[0]) &&
        !isNil(latest?.interval_upper_bounds?.[0])
          ? [
              latest?.interval_lower_bounds?.[0] as number,
              latest?.interval_upper_bounds?.[0] as number,
            ]
          : [],
      unit: question.unit,
      actual_resolve_time: question.actual_resolve_time ?? null,
      discreteValueOptions,
    },
    false
  );
  const displayValueChunks = displayValue.split("\n");
  const [centerLabel, intervalLabel] = displayValueChunks;
  const isClosed = question.status === QuestionStatus.CLOSED;
  const accentStyle =
    !isClosed && colorOverride
      ? ({ color: colorOverride } as const)
      : undefined;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-center gap-0 pt-0.5 tabular-nums md:gap-0.5 md:pt-1",
        {
          "text-olive-900 dark:text-olive-900-dark": !isClosed && !accentStyle,
          "text-gray-800 dark:text-gray-800-dark": isClosed,
          // Feed variant: center on mobile, left on desktop
          "text-center md:text-left": variant === "feed",
          // Question variant: always center
          "text-center": variant === "question",
          "gap-0.5 md:gap-0.5": isEmbed,
        }
      )}
    >
      <div
        style={accentStyle}
        className={cn("text-sm font-bold md:text-base", {
          "mb-1 text-base": size === "lg",
          "mb-0 truncate text-sm md:text-sm": isEmbed,
          "text-olive-800 dark:text-olive-800-dark": isEmbed && !accentStyle,
          "text-[18px] font-bold text-olive-900 dark:text-olive-900-dark":
            isEmbedBelow376,
        })}
      >
        {centerLabel}
      </div>
      {!isNil(intervalLabel) && !isEmbedBelow376 && (
        <div
          style={accentStyle}
          className={cn("text-[10px] font-normal tabular-nums md:text-xs", {
            "text-sm": size === "lg",
            "mb-0 text-xs md:text-xs": isEmbed && !isEmbedWide,
            "mb-0 text-sm md:text-sm": isEmbedWide,
            "whitespace-normal break-words": isEmbed && isDate,
            truncate: isEmbed && !isDate,
          })}
        >
          {intervalLabel}
        </div>
      )}
    </div>
  );
};

export default ContinuousCPBar;
