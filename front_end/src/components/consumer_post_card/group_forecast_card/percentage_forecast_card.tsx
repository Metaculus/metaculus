import { useLocale } from "next-intl";
import { FC } from "react";

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
};

const PercentageForecastCard: FC<Props> = ({ post }) => {
  const visibleChoicesCount = 3;
  const locale = useLocale();
  if (!isMultipleChoicePost(post) && !isGroupOfQuestionsPost(post)) {
    return null;
  }

  const isPostClosed = post.status === PostStatus.CLOSED;
  const choices = generateChoiceItems(post, visibleChoicesCount, locale);
  const visibleChoices = choices.slice(0, visibleChoicesCount);
  const otherItemsCount = choices.length - visibleChoices.length;

  return (
    <ForecastCardWrapper otherItemsCount={otherItemsCount}>
      {visibleChoices.map((choice) => {
        const choiceValue = getPredictionDisplayValue(
          choice.aggregationValues.at(-1),
          {
            questionType: QuestionType.Binary,
            scaling: choice.scaling,
            actual_resolve_time: choice.actual_resolve_time ?? null,
            emptyLabel: "Upcoming",
          }
        );
        const isChoiceClosed = choice.closeTime
          ? choice.closeTime < Date.now()
          : false;

        return (
          <ForecastChoiceBar
            key={choice.id ?? choice.choice}
            choiceLabel={choice.choice}
            choiceValue={choiceValue}
            isClosed={isChoiceClosed || isPostClosed}
            displayedResolution={choice.displayedResolution}
            resolution={choice.resolution}
            progress={Number(choiceValue.replace("%", ""))}
            color={choice.color}
            isBordered={true}
          />
        );
      })}
    </ForecastCardWrapper>
  );
};

function generateChoiceItems(
  post: PostWithForecasts,
  visibleChoicesCount: number,
  locale: string
) {
  if (isMultipleChoicePost(post)) {
    return generateChoiceItemsFromMultipleChoiceForecast(post.question, {
      activeCount: visibleChoicesCount,
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
