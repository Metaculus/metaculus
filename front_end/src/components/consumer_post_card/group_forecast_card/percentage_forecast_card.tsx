"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
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
};

const PercentageForecastCard: FC<Props> = ({ post, forceColorful }) => {
  const visibleChoicesCount = 3;
  const locale = useLocale();
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);

  const isMC = isMultipleChoicePost(post);
  const isGroupBinary =
    isGroupOfQuestionsPost(post) &&
    post.group_of_questions?.questions?.every(
      (q) => q.type === QuestionType.Binary
    );
  const cpRevealTime = post.question?.cp_reveal_time;
  const emptyLabel =
    cpRevealTime && new Date(cpRevealTime).getTime() > Date.now()
      ? t("hidden")
      : t("Upcoming");

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
  }, [post, locale, t, emptyLabel]);

  if (!isMC && !isGroupOfQuestionsPost(post)) return null;

  const isPostClosed = post.status === PostStatus.CLOSED;

  const visible = expanded
    ? allChoices
    : allChoices.slice(0, visibleChoicesCount);
  const hidden = expanded ? [] : allChoices.slice(visibleChoicesCount);

  const visibleSumMC = visible.reduce((s, c) => s + c.percent, 0);
  const othersTotal = isMC
    ? Math.max(0, Math.min(100, 100 - Math.round(visibleSumMC)))
    : 0;

  return (
    <ForecastCardWrapper
      otherItemsCount={hidden.length}
      othersTotal={othersTotal}
      expanded={expanded}
      onExpand={() => setExpanded(true)}
      hideOthersValue={isGroupBinary}
    >
      {visible.map((choice) => (
        <ForecastChoiceBar
          key={choice.id ?? choice.choice}
          choiceLabel={choice.choice}
          choiceValue={choice.valueStr}
          isClosed={choice.isChoiceClosed || isPostClosed}
          displayedResolution={choice.displayedResolution}
          resolution={choice.resolution}
          progress={choice.percent}
          color={choice.color}
          isBordered={true}
          forceColorful={forceColorful}
        />
      ))}
    </ForecastCardWrapper>
  );
};
function generateChoiceItems(
  post: PostWithForecasts,
  visibleChoicesCount: number,
  locale: string,
  t: ReturnType<typeof useTranslations>
) {
  if (isMultipleChoicePost(post)) {
    return generateChoiceItemsFromMultipleChoiceForecast(post.question, t, {
      activeCount: visibleChoicesCount,
      showNoResolutions: false,
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
