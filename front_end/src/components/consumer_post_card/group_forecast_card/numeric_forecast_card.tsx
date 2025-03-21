import { isNil } from "lodash";
import { useLocale } from "next-intl";
import { FC } from "react";

import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  generateChoiceItemsFromGroupQuestions,
  getChoiceOptionValue,
  scaleInternalLocation,
} from "@/utils/charts";
import {
  isGroupOfQuestionsPost,
  sortGroupPredictionOptions,
} from "@/utils/questions";

import ForecastCardWrapper from "./forecast_card_wrapper";
import ForecastChoiceBar from "./forecast_choice_bar";

type Props = {
  post: PostWithForecasts;
};

const NumericForecastCard: FC<Props> = ({ post }) => {
  const visibleChoicesCount = 3;
  const locale = useLocale();

  if (!isGroupOfQuestionsPost(post)) {
    return null;
  }

  const sortedQuestions = sortGroupPredictionOptions(
    post.group_of_questions?.questions as QuestionWithNumericForecasts[],
    post.group_of_questions
  );

  const choices = generateChoiceItemsFromGroupQuestions(sortedQuestions, {
    activeCount: visibleChoicesCount,
    locale,
  });
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
  const visibleChoices = sortedChoices.slice(0, visibleChoicesCount);
  const otherItemsCount = sortedChoices.length - visibleChoices.length;
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
    <ForecastCardWrapper otherItemsCount={otherItemsCount}>
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
        }) => {
          const isChoiceClosed = closeTime ? closeTime < Date.now() : false;
          const rawChoiceValue =
            aggregationValues[aggregationValues.length - 1] ?? null;
          const formattedChoiceValue = getChoiceOptionValue(
            rawChoiceValue,
            QuestionType.Numeric,
            scaling
          );
          const scaledChoiceValue = scaleInternalLocation(rawChoiceValue ?? 0, {
            range_min: scaling?.range_min ?? 0,
            range_max: scaling?.range_max ?? 1,
            zero_point: scaling?.zero_point ?? null,
          });
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
