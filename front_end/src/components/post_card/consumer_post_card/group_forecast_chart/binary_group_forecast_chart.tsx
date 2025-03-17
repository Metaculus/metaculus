import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
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
import cn from "@/utils/cn";
import { addOpacityToHex } from "@/utils/colors";
import {
  isGroupOfQuestionsPost,
  isMcQuestion,
  isSuccessfullyResolved,
} from "@/utils/questions";

type Props = {
  post: PostWithForecasts;
};

const BinaryGroupForecastChart: FC<Props> = ({ post }) => {
  const visibleChoicesCount = 3;
  const t = useTranslations();
  const locale = useLocale();
  const { getThemeColor } = useAppTheme();
  if (!isMcQuestion(post.question) && !isGroupOfQuestionsPost(post)) {
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
          QuestionType.Binary
        );
        const isChoiceClosed = choice.closeTime
          ? choice.closeTime < Date.now()
          : false;
        const isSuccessfullResolution = isSuccessfullyResolved(
          choice.resolution
        );

        return (
          <div
            key={choice.id}
            className={cn(
              "relative flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-blue-400 bg-transparent px-2.5 py-1 text-base font-medium leading-6 text-gray-900 dark:border-blue-400-dark dark:text-gray-900-dark",
              {
                "border-2 border-purple-700 text-purple-800 dark:border-purple-700-dark dark:text-purple-800-dark":
                  isSuccessfullResolution,
                "border-2 border-gray-400 text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark":
                  !isNil(choice.resolution) && !isSuccessfullResolution,
              }
            )}
          >
            <span className="z-10 line-clamp-1 max-w-[85%]">
              {choice.choice}
            </span>
            <span className="z-10 text-nowrap">
              {choice.displayedResolution
                ? `${isSuccessfullResolution ? t("resolved") : ""} ${choice.displayedResolution}`
                : choiceValue}
            </span>

            <div
              className={cn("absolute -inset-[1px] z-0 h-8 rounded-lg border")}
              style={{
                display: (() => {
                  if (choice.resolution) {
                    return "none";
                  }
                  return "block";
                })(),
                width: (() => {
                  return choiceValue.includes("%")
                    ? `max(${choiceValue}, 3%)`
                    : `${choiceValue}%`;
                })(),
                background: (() => {
                  if (choice.resolution) {
                    return "transparent";
                  } else if (isPostClosed || isChoiceClosed) {
                    return addOpacityToHex(
                      getThemeColor(METAC_COLORS.gray["500"]),
                      0.5
                    );
                  }
                  return addOpacityToHex(getThemeColor(choice.color), 0.3);
                })(),
                borderColor: (() => {
                  if (isPostClosed || isChoiceClosed) {
                    return getThemeColor(METAC_COLORS.gray["500"]);
                  }
                  return getThemeColor(choice.color);
                })(),
              }}
            ></div>
          </div>
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
  if (isMcQuestion(post.question)) {
    return generateChoiceItemsFromMultipleChoiceForecast(
      post.question as QuestionWithMultipleChoiceForecasts,
      {
        activeCount: visibleChoicesCount,
      }
    );
  } else if (isGroupOfQuestionsPost(post)) {
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
export default BinaryGroupForecastChart;
