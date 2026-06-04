"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import { useListChartExpanded } from "@/app/(main)/questions/[id]/components/question_view/consumer_question_view/consumer_list_chart_shell";
import { getEffectiveVisibleCount } from "@/constants/questions";
import { useOverlayMaxHeight } from "@/hooks/use_overlay_max_height";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { findPreviousTimestamp } from "@/utils/charts/cursor";
import cn from "@/utils/core/cn";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import {
  generateChoiceItemsFromGroupQuestions,
  generateChoiceItemsFromMultipleChoiceForecast,
} from "@/utils/questions/choices";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
} from "@/utils/questions/helpers";

import ForecastCardWrapper from "./forecast_card_wrapper";
import ForecastChoiceBar from "./forecast_choice_bar";

type Props = {
  post: PostWithForecasts;
  forceColorful?: boolean;
  compact?: boolean;
  buttonVariant?: "primary" | "minimal";
  fillHeight?: boolean;
};

const PercentageForecastCard: FC<Props> = ({
  post,
  forceColorful,
  compact,
  buttonVariant,
  fillHeight = false,
}) => {
  const locale = useLocale();
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);
  const { setIsExpanded, cursorTimestamp } = useListChartExpanded();
  const { containerRef, overlayMaxHeight } = useOverlayMaxHeight(expanded);

  const isMC = isMultipleChoicePost(post);
  const cpRevealTime = post.question?.cp_reveal_time;
  const emptyLabel =
    cpRevealTime && new Date(cpRevealTime).getTime() > Date.now()
      ? t("hidden")
      : t("Upcoming");

  const totalOptionsCount = isMC
    ? post.question?.options?.length ?? 0
    : isGroupOfQuestionsPost(post)
      ? post.group_of_questions?.questions?.length ?? 0
      : 0;
  const visibleChoicesCount = getEffectiveVisibleCount(totalOptionsCount);

  const allChoices = useMemo(() => {
    const raw = generateChoiceItems(post, visibleChoicesCount, locale, t);
    return raw.map((choice) => {
      const valueStr = getPredictionDisplayValue(
        choice.aggregationValues.at(-1),
        {
          questionType: QuestionType.Binary,
          scaling: choice.scaling,
          actual_resolve_time: choice.actual_resolve_time ?? null,
          emptyLabel,
        }
      );
      const percent =
        typeof valueStr === "string"
          ? Number(valueStr.replace("%", "")) || 0
          : 0;

      const isChoiceClosed = choice.closeTime
        ? choice.closeTime < Date.now()
        : false;

      return {
        ...choice,
        valueStr,
        percent,
        isChoiceClosed,
      };
    });
  }, [post, visibleChoicesCount, locale, t, emptyLabel]);

  // Resolves each choice's value at the cursor (or last) timestamp using its
  // own timeline, since history lengths differ per sub-question.
  const displayChoices = useMemo(() => {
    const fallbackLatestTs = allChoices.reduce<number | null>(
      (maxTs, choice) => {
        const own = choice.aggregationTimestamps;
        const lastTs = own[own.length - 1] ?? null;
        if (lastTs === null) return maxTs;
        return maxTs === null || lastTs > maxTs ? lastTs : maxTs;
      },
      null
    );
    const refTs = cursorTimestamp ?? fallbackLatestTs;
    if (refTs === null) return allChoices;

    return allChoices.map((choice) => {
      const ownTimestamps = choice.aggregationTimestamps;
      const closestTs = findPreviousTimestamp(ownTimestamps, refTs);
      const ownIdx = ownTimestamps.indexOf(closestTs);
      const rawVal =
        ownIdx >= 0 ? choice.aggregationValues[ownIdx] ?? null : null;
      const valueStr = getPredictionDisplayValue(rawVal, {
        questionType: QuestionType.Binary,
        scaling: choice.scaling,
        actual_resolve_time: choice.actual_resolve_time ?? null,
        emptyLabel,
      });
      const percent =
        typeof valueStr === "string"
          ? Number(valueStr.replace("%", "")) || 0
          : 0;
      return { ...choice, valueStr, percent };
    });
  }, [allChoices, cursorTimestamp, emptyLabel]);

  if (!isMC && !isGroupOfQuestionsPost(post)) return null;

  const isPostClosed = post.status === PostStatus.CLOSED;

  const collapsedChoices = displayChoices.slice(0, visibleChoicesCount);
  const hiddenCount = Math.max(0, displayChoices.length - visibleChoicesCount);

  const renderBars = (choices: typeof allChoices, stretchBars = false) =>
    choices.map((choice) => (
      <ForecastChoiceBar
        key={choice.id ?? choice.choice}
        choiceLabel={choice.choice}
        choiceValue={choice.valueStr}
        isClosed={choice.isChoiceClosed || isPostClosed}
        displayedResolution={choice.displayedResolution}
        resolution={choice.resolution}
        progress={choice.percent}
        color={choice.color}
        forceColorful={forceColorful}
        compact={compact}
        className={stretchBars ? "flex-1" : undefined}
      />
    ));

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
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setExpanded(false);
              setIsExpanded(false);
            }}
          />
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
              {renderBars(displayChoices)}
            </ForecastCardWrapper>
          </div>
        </>
      )}
    </div>
  );
};

function generateChoiceItems(
  post: PostWithForecasts,
  visibleChoicesCount: number,
  locale: string,
  t: ReturnType<typeof useTranslations>
) {
  if (isMultipleChoicePost(post)) {
    const cpRevealTime = post.question?.cp_reveal_time;
    const cpRevealsOn =
      cpRevealTime && new Date(cpRevealTime) >= new Date()
        ? cpRevealTime
        : null;
    return generateChoiceItemsFromMultipleChoiceForecast(post.question, t, {
      activeCount: visibleChoicesCount,
      showNoResolutions: false,
      cpRevealsOn,
    });
  }
  if (isGroupOfQuestionsPost(post)) {
    return generateChoiceItemsFromGroupQuestions(post.group_of_questions, {
      activeCount: visibleChoicesCount,
      locale,
    });
  }
  return [];
}

export default PercentageForecastCard;
