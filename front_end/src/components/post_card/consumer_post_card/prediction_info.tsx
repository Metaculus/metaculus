import { intlFormatDistance } from "date-fns";
import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import { PostWithForecasts, QuestionStatus } from "@/types/post";
import { ForecastAvailability, QuestionType } from "@/types/question";
import "@github/relative-time-element";
import { getDisplayValue } from "@/utils/charts";
import cn from "@/utils/cn";
import { formatResolution, isSuccessfullyResolved } from "@/utils/questions";

type Props = {
  post: PostWithForecasts;
  forecastAvailability?: ForecastAvailability | null;
};

const ConsumerPredictionInfo: FC<Props> = ({ post, forecastAvailability }) => {
  const { question, group_of_questions } = post;
  const t = useTranslations();
  const locale = useLocale();

  // CP empty
  if (forecastAvailability?.isEmpty) {
    return null;
  }
  // CP hidden
  if (!isNil(forecastAvailability?.cpRevealsOn)) {
    return (
      <div className="flex min-w-[200px] max-w-[200px] flex-col items-center gap-0">
        <span className="text-xs font-normal leading-4 text-purple-700 dark:text-purple-700-dark">
          {t("forecastRevealed")}{" "}
        </span>
        <relative-time
          datetime={forecastAvailability.cpRevealsOn}
          lang={locale}
          className="text-base font-medium leading-6 text-purple-800 dark:text-purple-800-dark"
        >
          {intlFormatDistance(forecastAvailability.cpRevealsOn, new Date(), {
            locale,
          })}
        </relative-time>
      </div>
    );
  }

  // TODO: implement view for group and MC questions
  if (group_of_questions || question?.type === QuestionType.MultipleChoice) {
    return <div>Group or MC question</div>;
  }

  if (question) {
    // Resolved/Annulled/Ambiguous
    if (question.resolution) {
      const formatedResolution = formatResolution(
        question.resolution,
        question.type,
        locale
      );
      const successfullResolution = isSuccessfullyResolved(question.resolution);
      return (
        <div className="flex min-w-[200px] max-w-[200px] justify-center">
          <div
            className={cn(
              "flex w-fit flex-col items-center rounded bg-purple-100 px-4 py-2 dark:bg-purple-100-dark",
              {
                "bg-gray-300 dark:bg-gray-300-dark": !successfullResolution,
              }
            )}
          >
            {successfullResolution && (
              <span className="text-xs font-medium uppercase leading-4 text-purple-600 dark:text-purple-600-dark">
                {t("resolved")}
              </span>
            )}
            <span
              className={cn(
                "text-base font-medium leading-6 text-purple-800 dark:text-purple-800-dark",
                {
                  "text-gray-700 dark:text-gray-700-dark":
                    !successfullResolution,
                }
              )}
            >
              {formatedResolution}
            </span>
          </div>
        </div>
      );
    }

    // Open/Closed
    const isClosed = question.status === QuestionStatus.CLOSED;
    const latest = question.aggregations.recency_weighted.latest;
    const communityPredictionDisplayValue = latest
      ? getDisplayValue({
          value: latest.centers?.[0],
          questionType: question.type,
          scaling: question.scaling,
        })
      : null;

    return (
      <div className="flex min-w-[200px] max-w-[200px] justify-center">
        <div
          className={cn(
            "flex w-fit flex-col items-center rounded border-2 border-blue-400 bg-transparent px-5 py-2 dark:border-blue-400-dark dark:bg-transparent",
            {
              "border-gray-300 dark:border-gray-300-dark": isClosed,
            }
          )}
        >
          <span
            className={cn(
              "text-lg font-bold leading-7 text-blue-700 dark:text-blue-700-dark",
              {
                "text-gray-600 dark:text-gray-600-dark": isClosed,
              }
            )}
          >
            {communityPredictionDisplayValue}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default ConsumerPredictionInfo;
