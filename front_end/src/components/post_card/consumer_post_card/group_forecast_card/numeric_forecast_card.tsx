import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  generateChoiceItemsFromGroupQuestions,
  getChoiceOptionValue,
} from "@/utils/charts";
import {
  isGroupOfQuestionsPost,
  isSuccessfullyResolved,
} from "@/utils/questions";

import ForecastChoiceBar from "./forecast_choice_bar";

type Props = {
  post: PostWithForecasts;
};

// TODO: implement numeric group forecast chart
const NumericForecastCard: FC<Props> = ({ post }) => {
  const visibleChoicesCount = 3;
  const t = useTranslations();
  const locale = useLocale();

  if (!isGroupOfQuestionsPost(post)) {
    return null;
  }

  const choices = generateChoiceItemsFromGroupQuestions(
    post.group_of_questions?.questions as QuestionWithNumericForecasts[],
    {
      activeCount: visibleChoicesCount,
      locale,
    }
  );
  const sortedChoices = [...choices].sort((a, b) => {
    // First comes the resolved/anulled choices
    const aResolved = !isNil(a.resolution);
    const bResolved = !isNil(b.resolution);
    if (aResolved !== bResolved) {
      return bResolved ? 1 : -1;
    }

    const aValue = a.aggregationValues[a.aggregationValues.length - 1] ?? 0;
    const bValue = b.aggregationValues[b.aggregationValues.length - 1] ?? 0;
    return bValue - aValue;
  });
  const isPostClosed = post.status === PostStatus.CLOSED;
  const visibleChoices = sortedChoices.slice(0, visibleChoicesCount);
  const otherItemsCount = sortedChoices.length - visibleChoices.length;
  const maxChoiceValue = Math.max(
    ...sortedChoices
      .filter((choice) => isNil(choice.resolution))
      .map(
        (choice) =>
          choice.aggregationValues[choice.aggregationValues.length - 1] ?? 0
      )
  );

  return (
    <div className="flex w-full flex-col gap-2">
      {visibleChoices.map((choice) => {
        const isChoiceClosed = choice.closeTime
          ? choice.closeTime < Date.now()
          : false;
        const rawChoiceValue =
          choice.aggregationValues[choice.aggregationValues.length - 1] ?? null;

        const formattedChoiceValue = getChoiceOptionValue(
          rawChoiceValue,
          QuestionType.Numeric,
          choice.scaling
        );
        const relativeWidth = !isNil(choice.resolution)
          ? 100
          : maxChoiceValue > 0
            ? ((rawChoiceValue ?? 0) / maxChoiceValue) * 100
            : 0;

        return (
          <ForecastChoiceBar
            key={choice.id}
            choiceLabel={choice.choice}
            choiceValue={formattedChoiceValue}
            isSuccessfullyResolved={isSuccessfullyResolved(choice.resolution)}
            isClosed={isChoiceClosed || isPostClosed}
            displayedResolution={choice.displayedResolution}
            resolution={choice.resolution}
            width={relativeWidth}
            color={choice.color}
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

export default NumericForecastCard;
