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
  scaleInternalLocation,
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
      preserveOrder: true,
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
    const aValueScaled = scaleInternalLocation(aValue, {
      range_min: a.scaling?.range_min ?? 0,
      range_max: a.scaling?.range_max ?? 1,
      zero_point: a.scaling?.zero_point ?? null,
    });
    const bValueScaled = scaleInternalLocation(bValue, {
      range_min: b.scaling?.range_min ?? 0,
      range_max: b.scaling?.range_max ?? 1,
      zero_point: b.scaling?.zero_point ?? null,
    });
    return bValueScaled - aValueScaled;
  });

  const isPostClosed = post.status === PostStatus.CLOSED;
  const visibleChoices = sortedChoices.slice(0, visibleChoicesCount);
  const otherItemsCount = sortedChoices.length - visibleChoices.length;
  const maxScaledValue = Math.max(
    ...sortedChoices
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
      )
  );

  return (
    <div className="flex w-full flex-col gap-2">
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
            : maxScaledValue > 0
              ? ((scaledChoiceValue ?? 0) / maxScaledValue) * 100
              : 0;

          return (
            <ForecastChoiceBar
              key={id}
              choiceLabel={choice}
              choiceValue={formattedChoiceValue}
              isSuccessfullyResolved={isSuccessfullyResolved(resolution)}
              isClosed={isChoiceClosed || isPostClosed}
              displayedResolution={displayedResolution}
              resolution={resolution}
              width={relativeWidth}
              color={color}
            />
          );
        }
      )}
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
