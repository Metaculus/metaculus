"use client";

import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import { FC, useState } from "react";

import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType, Scaling } from "@/types/question";
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
};

const NumericForecastCard: FC<Props> = ({ post, forceColorful }) => {
  const visibleChoicesCount = 3;
  const locale = useLocale();
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);

  if (!isGroupOfQuestionsPost(post)) {
    return null;
  }

  const isDateGroup = checkGroupOfQuestionsPostType(post, QuestionType.Date);

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

  const visibleChoices = expanded
    ? sortedChoices
    : sortedChoices.slice(0, visibleChoicesCount);

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

  return (
    <ForecastCardWrapper
      otherItemsCount={
        expanded ? 0 : Math.max(0, sortedChoices.length - visibleChoicesCount)
      }
      expanded={expanded}
      onExpand={() => setExpanded(true)}
      hideOthersValue
    >
      {visibleChoices.map(
        ({
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
        }) => {
          const isChoiceClosed = closeTime ? closeTime < Date.now() : false;
          const rawChoiceValue =
            aggregationValues[aggregationValues.length - 1] ?? null;
          const normalizedScaling: Scaling = {
            range_min: scaling?.range_min ?? 0,
            range_max: scaling?.range_max ?? 1,
            zero_point: scaling?.zero_point ?? null,
          };
          const formattedChoiceValue = getPredictionDisplayValue(
            rawChoiceValue,
            {
              questionType: isDateGroup
                ? QuestionType.Date
                : QuestionType.Numeric,
              scaling: normalizedScaling,
              actual_resolve_time: actual_resolve_time ?? null,
              emptyLabel: t("Upcoming"),
            }
          );

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
            />
          );
        }
      )}
    </ForecastCardWrapper>
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
    return ((scaledChoiceValue - minScaledValue) / totalRange) * 100;
  }

  return maxScaledValue > 0
    ? ((scaledChoiceValue ?? 0) / maxScaledValue) * 100
    : 0;
}
export default NumericForecastCard;
