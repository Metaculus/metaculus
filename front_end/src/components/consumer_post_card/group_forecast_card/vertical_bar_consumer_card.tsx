"use client";

import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { FC } from "react";

import { getEffectiveVisibleCount } from "@/constants/questions";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { scaleInternalLocation } from "@/utils/math";
import { generateChoiceItemsFromGroupQuestions } from "@/utils/questions/choices";
import {
  checkGroupOfQuestionsPostType,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";

const CHART_HEIGHT = 100;
const MIN_BAR_HEIGHT = 6;
const LABEL_TOP_PADDING = 28;
const GRID_RATIOS = [0.25, 0.5, 0.75, 1];

type Props = {
  post: PostWithForecasts;
};

const VerticalBarConsumerCard: FC<Props> = ({ post }) => {
  const locale = useLocale();
  if (!isGroupOfQuestionsPost(post)) return null;

  const isDateGroup = checkGroupOfQuestionsPostType(post, QuestionType.Date);
  const visibleChoicesCount = getEffectiveVisibleCount(
    post.group_of_questions?.questions?.length ?? 0
  );

  const choices = generateChoiceItemsFromGroupQuestions(
    post.group_of_questions,
    {
      activeCount: visibleChoicesCount,
      locale,
      shortBounds: true,
      excludeUnit: true,
      resolutionSigfigs: 3,
    }
  );

  // generateChoiceItemsFromGroupQuestions returns all questions; slice to avoid overlapping bars
  const bars = choices
    .slice(0, visibleChoicesCount)
    .map(
      ({
        id,
        choice,
        aggregationValues,
        scaling,
        actual_resolve_time,
        displayedResolution,
      }) => {
        const raw = aggregationValues[aggregationValues.length - 1] ?? null;
        const s = {
          range_min: scaling?.range_min ?? 0,
          range_max: scaling?.range_max ?? 1,
          zero_point: scaling?.zero_point ?? null,
        };
        const scaledV = isNil(raw) ? NaN : scaleInternalLocation(raw, s);
        const label =
          displayedResolution ??
          getPredictionDisplayValue(raw, {
            questionType: isDateGroup
              ? QuestionType.Date
              : QuestionType.Numeric,
            scaling: s,
            actual_resolve_time: actual_resolve_time ?? null,
            emptyLabel: "–",
          });
        return { id, choice, scaledV, label };
      }
    );

  const validScaled = bars.map((b) => b.scaledV).filter((v) => !isNaN(v));
  const maxScaled = validScaled.length > 0 ? Math.max(...validScaled) : 1;
  const minScaled = validScaled.length > 0 ? Math.min(...validScaled) : 0;
  const valueRange = maxScaled - minScaled;

  const getBarHeight = (scaledV: number) => {
    if (isNaN(scaledV)) return MIN_BAR_HEIGHT;
    if (valueRange <= 0) return CHART_HEIGHT;
    return (
      MIN_BAR_HEIGHT +
      ((scaledV - minScaled) / valueRange) * (CHART_HEIGHT - MIN_BAR_HEIGHT)
    );
  };

  return (
    <div className="flex w-full flex-col gap-1">
      <div
        className="relative flex w-full gap-2"
        style={{ height: `${CHART_HEIGHT + LABEL_TOP_PADDING}px` }}
      >
        {GRID_RATIOS.map((ratio, i) => (
          <div
            key={i}
            className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-blue-300 dark:border-blue-300-dark"
            style={{ bottom: `${ratio * CHART_HEIGHT}px` }}
          />
        ))}

        {bars.map(({ id, scaledV, label }, idx) => {
          const barHeight = getBarHeight(scaledV);
          return (
            <div key={id ?? idx} className="relative flex-1">
              <span
                className="absolute left-0 right-0 text-center text-base font-bold leading-6 text-blue-700 dark:text-blue-700-dark"
                style={{ bottom: `${barHeight + 2}px` }}
              >
                {label}
              </span>
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-[2px] bg-blue-400 dark:bg-blue-400-dark"
                style={{ height: `${barHeight}px`, width: "20px" }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex w-full gap-2">
        {bars.map(({ id, choice }, idx) => (
          <span
            key={id ?? idx}
            className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-medium leading-5 text-blue-700 dark:text-blue-700-dark"
          >
            {choice}
          </span>
        ))}
      </div>
    </div>
  );
};

export default VerticalBarConsumerCard;
