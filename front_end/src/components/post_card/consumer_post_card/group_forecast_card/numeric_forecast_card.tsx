import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { generateChoiceItemsFromGroupQuestions } from "@/utils/charts";
import { isGroupOfQuestionsPost } from "@/utils/questions";

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
  const visibleChoices = choices.slice(0, visibleChoicesCount);
  const otherItemsCount = choices.length - visibleChoices.length;

  return (
    <div className="flex w-full flex-col gap-2">
      {visibleChoices.map((choice) => {
        // TODO: implement numeric choice items
        return <div key={choice.id}>{choice.choice}</div>;
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
