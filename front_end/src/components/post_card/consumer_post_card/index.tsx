import { isNil } from "lodash";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostStatus, PostWithForecasts } from "@/types/post";
import cn from "@/utils/cn";
import { getPostLink } from "@/utils/navigation";
import {
  getGroupForecastAvailability,
  getQuestionForecastAvailability,
} from "@/utils/questions";

import ConsumerKeyFactor from "./key_factor";
import ConsumerPredictionInfo from "./prediction_info";

type Props = {
  post: PostWithForecasts;
};

const ConsumerPostCard: FC<Props> = ({ post }) => {
  const { title, key_factors } = post;

  const t = useTranslations();
  const isShortTitle = title.length < 100;
  const forecastAvailability = getPostForecastAvailability(post);

  return (
    <Link
      href={getPostLink(post)}
      className={cn(
        "flex flex-col items-center rounded border border-blue-400 bg-gray-0 p-6 no-underline @container dark:border-blue-400-dark dark:bg-gray-0-dark"
      )}
    >
      <div className="flex w-full flex-col items-center justify-between gap-4 @[500px]:flex-row @[500px]:gap-2">
        <div className="flex flex-col gap-4 @[500px]:gap-2">
          <h4 className="m-0 max-w-xl text-center text-base font-medium @[500px]:text-left">
            {title}
          </h4>
          {[PostStatus.PENDING_RESOLUTION, PostStatus.CLOSED].includes(
            post.status
          ) && (
            <p className="m-0 text-center text-xs font-normal leading-4 text-gray-1000 text-opacity-50 @[500px]:text-left dark:text-gray-1000-dark dark:text-opacity-50">
              {t("closedForForecastingDescription")}
            </p>
          )}
          {key_factors && (
            <ConsumerKeyFactor
              keyFactor={key_factors}
              className={cn("mt-2 hidden w-full @[500px]:mt-0", {
                "hidden @[500px]:flex": isShortTitle,
              })}
            />
          )}
        </div>

        <ConsumerPredictionInfo
          post={post}
          forecastAvailability={forecastAvailability}
        />
      </div>
      {key_factors && (
        <ConsumerKeyFactor
          keyFactor={key_factors}
          className={cn("mt-4 flex w-full @[500px]:mt-5", {
            "@[500px]:hidden": isShortTitle,
          })}
        />
      )}
    </Link>
  );
};

function getPostForecastAvailability(post: PostWithForecasts) {
  const { question, group_of_questions } = post;
  if (!isNil(question)) {
    return getQuestionForecastAvailability(question);
  } else if (!isNil(group_of_questions)) {
    return getGroupForecastAvailability(group_of_questions.questions);
  }
  return null;
}

export default ConsumerPostCard;
