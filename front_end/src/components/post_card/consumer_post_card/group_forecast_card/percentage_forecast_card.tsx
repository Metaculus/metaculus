import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import { PostStatus, PostWithForecasts } from "@/types/post";
import {
  QuestionType,
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  generateChoiceItemsFromGroupQuestions,
  generateChoiceItemsFromMultipleChoiceForecast,
  getChoiceOptionValue,
} from "@/utils/charts";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isSuccessfullyResolved,
} from "@/utils/questions";

import ForecastChoiceBar from "./forecast_choice_bar";

type Props = {
  post: PostWithForecasts;
};

const PercentageForecastCard: FC<Props> = ({ post }) => {
  const visibleChoicesCount = 3;
  const t = useTranslations();
  const locale = useLocale();
  if (!isMultipleChoicePost(post) && !isGroupOfQuestionsPost(post)) {
    return null;
  }

  const isPostClosed = post.status === PostStatus.CLOSED;
  const choices = generateChoiceItems(post, visibleChoicesCount, locale);
  const visibleChoices = choices.slice(0, visibleChoicesCount);
  const otherItemsCount = choices.length - visibleChoices.length;

  return (
    <div className="flex w-full flex-col gap-2">
      {visibleChoices.map((choice) => {
        const choiceValue = getChoiceOptionValue(
          choice.aggregationValues[choice.aggregationValues.length - 1] ?? null,
          QuestionType.Binary,
          choice.scaling
        );
        const isChoiceClosed = choice.closeTime
          ? choice.closeTime < Date.now()
          : false;

        return (
          <ForecastChoiceBar
            key={choice.id ?? choice.choice}
            choiceLabel={choice.choice}
            choiceValue={choiceValue}
            isSuccessfullyResolved={isSuccessfullyResolved(choice.resolution)}
            isClosed={isChoiceClosed || isPostClosed}
            displayedResolution={choice.displayedResolution}
            resolution={choice.resolution}
            width={Math.max(Number(choiceValue.replace("%", "")), 3)}
            color={choice.color}
            withWrapper={true}
          />
        );
      })}
      {otherItemsCount > 0 && (
        <div className="flex flex-row items-center text-gray-600 dark:text-gray-600-dark">
          <div className="self-center py-0 pr-1.5 text-center">
            <FontAwesomeIcon
              icon={faEllipsis}
              size="xl"
              className="resize-ellipsis"
            />
          </div>
          <div className="resize-label whitespace-nowrap px-1.5 py-0.5 text-left text-sm font-medium leading-4">
            {t("and")} {t("otherWithCount", { count: otherItemsCount })}
          </div>
        </div>
      )}
    </div>
  );
};

function generateChoiceItems(
  post: PostWithForecasts,
  visibleChoicesCount: number,
  locale: string
) {
  if (isMultipleChoicePost(post)) {
    return generateChoiceItemsFromMultipleChoiceForecast(
      post.question as QuestionWithMultipleChoiceForecasts,
      {
        activeCount: visibleChoicesCount,
      }
    );
  }
  if (isGroupOfQuestionsPost(post)) {
    return generateChoiceItemsFromGroupQuestions(
      post.group_of_questions?.questions as QuestionWithNumericForecasts[],
      {
        activeCount: visibleChoicesCount,
        locale,
      }
    );
  }
  return [];
}
export default PercentageForecastCard;
