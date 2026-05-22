"use client";

import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import { FC, useState } from "react";

import { useListChartExpanded } from "@/app/(main)/questions/[id]/components/question_view/consumer_question_view/consumer_list_chart_shell";
import { getEffectiveVisibleCount } from "@/constants/questions";
import { useOverlayMaxHeight } from "@/hooks/use_overlay_max_height";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType, Scaling } from "@/types/question";
import cn from "@/utils/core/cn";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { scaleInternalLocation } from "@/utils/math";
import { generateChoiceItemsFromGroupQuestions } from "@/utils/questions/choices";
import {
  checkGroupOfQuestionsPostType,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";

import ForecastCardWrapper from "./forecast_card_wrapper";
import ForecastChoiceBar from "./forecast_choice_bar";

type Props = {
  post: PostWithForecasts;
  forceColorful?: boolean;
  compact?: boolean;
  buttonVariant?: "primary" | "minimal";
  fillHeight?: boolean;
  borderOnly?: boolean;
};

const NumericForecastCard: FC<Props> = ({
  post,
  forceColorful,
  compact,
  buttonVariant,
  fillHeight = false,
  borderOnly = false,
}) => {
  const locale = useLocale();
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const { setIsExpanded, setHoveredChoiceName } = useListChartExpanded();
  const { containerRef, overlayMaxHeight } = useOverlayMaxHeight(expanded);

  if (!isGroupOfQuestionsPost(post)) {
    return null;
  }

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
    }
  );

  // Move resolved/annulled choices to the start
  const sortedChoices = [...choices].sort((a, b) => {
    const aResolved = !isNil(a.resolution);
    const bResolved = !isNil(b.resolution);
    if (aResolved !== bResolved) {
      return bResolved ? 1 : -1;
    }
    return 0;
  });

  const isPostClosed = post.status === PostStatus.CLOSED;
  const hiddenCount = Math.max(0, sortedChoices.length - visibleChoicesCount);
  const collapsedChoices = sortedChoices.slice(0, visibleChoicesCount);

  const scaledValues = [...sortedChoices]
    .filter((choice) => isNil(choice.resolution))
    .map(({ aggregationValues, scaling }) =>
      scaleInternalLocation(
        aggregationValues[aggregationValues.length - 1] ?? 0,
        {
          range_min: scaling?.range_min ?? 0,
          range_max: scaling?.range_max ?? 1,
          zero_point: scaling?.zero_point ?? null,
        }
      )
    );
  const maxScaledValue = Math.max(...scaledValues);
  const minScaledValue = Math.min(...scaledValues);

  const renderBars = (
    choices: typeof sortedChoices,
    stretchBars = false,
    hoverUpTo = Infinity
  ) =>
    choices.map(
      (
        {
          closeTime,
          aggregationValues,
          scaling,
          resolution,
          id,
          color,
          displayedResolution,
          choice,
          actual_resolve_time,
          unit,
        },
        index
      ) => {
        const isChoiceClosed = closeTime ? closeTime < Date.now() : false;
        const rawChoiceValue =
          aggregationValues[aggregationValues.length - 1] ?? null;
        const normalizedScaling: Scaling = {
          range_min: scaling?.range_min ?? 0,
          range_max: scaling?.range_max ?? 1,
          zero_point: scaling?.zero_point ?? null,
        };
        const formattedChoiceValue = getPredictionDisplayValue(rawChoiceValue, {
          questionType: isDateGroup ? QuestionType.Date : QuestionType.Numeric,
          scaling: normalizedScaling,
          actual_resolve_time: actual_resolve_time ?? null,
          emptyLabel: t("Upcoming"),
        });
        const scaledChoiceValue = !isNil(rawChoiceValue)
          ? scaleInternalLocation(rawChoiceValue, normalizedScaling)
          : NaN;
        const relativeWidth = !isNil(resolution)
          ? 100
          : calculateRelativeWidth({
              scaledChoiceValue,
              maxScaledValue,
              minScaledValue,
            });

        return (
          <ForecastChoiceBar
            key={id}
            choiceLabel={choice}
            choiceValue={formattedChoiceValue}
            isClosed={isChoiceClosed || isPostClosed}
            displayedResolution={displayedResolution}
            resolution={resolution}
            progress={relativeWidth}
            color={color}
            unit={unit}
            forceColorful={forceColorful}
            compact={compact}
            isBordered={false}
            borderOnly={borderOnly}
            onMouseEnter={
              index < hoverUpTo ? () => setHoveredChoiceName(choice) : undefined
            }
            onMouseLeave={
              index < hoverUpTo ? () => setHoveredChoiceName(null) : undefined
            }
            className={stretchBars ? "flex-1" : undefined}
          />
        );
      }
    );

  // Only fill height when all items are visible (no expand button).
  const effectiveFillHeight = fillHeight && hiddenCount === 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative", effectiveFillHeight && "flex flex-1 flex-col")}
    >
      <ForecastCardWrapper
        otherItemsCount={hiddenCount}
        expanded={expanded}
        onExpand={() => {
          setExpanded(true);
          setIsExpanded(true);
        }}
        compact={compact}
        buttonVariant={buttonVariant}
        className={effectiveFillHeight ? "flex-1" : undefined}
      >
        {renderBars(collapsedChoices, effectiveFillHeight)}
      </ForecastCardWrapper>
      {expanded && (
        <div
          className="absolute -left-[21px] -top-[21px] z-20 flex w-[calc(100%+42px)] flex-col overflow-hidden rounded-lg border border-gray-400/40 bg-gray-0 p-5 dark:border-gray-400-dark/40 dark:bg-gray-0-dark"
          style={{ maxHeight: overlayMaxHeight }}
        >
          <ForecastCardWrapper
            otherItemsCount={0}
            expanded={true}
            onCollapse={() => {
              setExpanded(false);
              setIsExpanded(false);
            }}
            compact={compact}
            buttonVariant={buttonVariant}
            className="min-h-0 flex-1"
          >
            {renderBars(sortedChoices, false, visibleChoicesCount)}
          </ForecastCardWrapper>
        </div>
      )}
    </div>
  );
};

function calculateRelativeWidth({
  scaledChoiceValue,
  maxScaledValue,
  minScaledValue,
}: {
  scaledChoiceValue: number;
  maxScaledValue: number;
  minScaledValue: number;
}) {
  if (isNaN(scaledChoiceValue)) return scaledChoiceValue;

  if (maxScaledValue === 0 && minScaledValue < 0) {
    if (scaledChoiceValue === 0) {
      return 100;
    } else {
      return (1 - scaledChoiceValue / minScaledValue) * 100;
    }
  }
  if (minScaledValue < 0) {
    const totalRange = maxScaledValue - minScaledValue;
    if (totalRange === 0) {
      return 100;
    }
    return ((scaledChoiceValue - minScaledValue) / totalRange) * 100;
  }

  return maxScaledValue > 0
    ? ((scaledChoiceValue ?? 0) / maxScaledValue) * 100
    : 0;
}
export default NumericForecastCard;
