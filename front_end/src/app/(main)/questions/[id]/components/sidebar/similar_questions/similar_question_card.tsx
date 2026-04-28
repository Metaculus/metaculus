import { faComment, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import PostVoter from "@/components/post_card/basic_post_card/post_voter";
import PostStatusIcon from "@/components/post_status/status_icon";
import RichText from "@/components/rich_text";
import { PostWithForecasts } from "@/types/post";
import { abbreviatedNumber } from "@/utils/formatters/number";
import { getPostLink } from "@/utils/navigation";
import { extractPostResolution } from "@/utils/questions/resolution";

import SimilarPredictionChip from "./similar_question_prediction_chip";

type Props = {
  post: PostWithForecasts;
  variant?: "forecaster" | "consumer";
};

const SimilarQuestionCard: FC<Props> = ({ post, variant = "forecaster" }) => {
  const t = useTranslations();
  const isForecaster = variant === "forecaster";

  const commentCount = post.comment_count ?? 0;
  const commentCountFormatted = abbreviatedNumber(
    commentCount,
    2,
    false,
    undefined,
    3
  );
  const forecastersFormatted = abbreviatedNumber(
    post.nr_forecasters,
    2,
    false,
    undefined,
    3
  );

  const resolutionData = extractPostResolution(post);

  return (
    <div className="flex flex-col gap-3 rounded border border-blue-400 bg-blue-100 px-3 py-4 dark:border-blue-400-dark dark:bg-blue-100-dark">
      <Link
        href={getPostLink(post)}
        className="flex flex-col gap-3 no-underline"
      >
        {!isForecaster && (
          <div className="flex items-center justify-center gap-6 text-xs font-normal text-gray-700 dark:text-gray-700-dark">
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={faComment}
                className="text-gray-400 dark:text-gray-400-dark"
              />
              <RichText>
                {(tags) => (
                  <span>
                    {t.rich("totalCommentsCount", {
                      total_count: commentCount,
                      total_count_formatted: commentCountFormatted,
                      ...tags,
                      strong: (chunks) => chunks,
                    })}
                  </span>
                )}
              </RichText>
            </span>
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={faUsers}
                className="text-gray-400 dark:text-gray-400-dark"
              />
              <RichText>
                {(tags) => (
                  <span>
                    {t.rich("forecastersWithCount", {
                      count: post.nr_forecasters,
                      count_formatted: forecastersFormatted,
                      ...tags,
                      strong: (chunks) => chunks,
                    })}
                  </span>
                )}
              </RichText>
            </span>
          </div>
        )}

        <h4 className="my-0 text-center text-base font-medium leading-6 text-gray-800 dark:text-gray-800-dark">
          {post.title}
        </h4>

        <SimilarPredictionChip post={post} variant={variant} />
      </Link>

      {isForecaster && (
        <div className="flex items-center gap-1.5">
          <PostVoter post={post} compact className="h-6" />
          <span className="flex h-6 items-center gap-1 rounded-xs bg-gray-200 px-1.5 text-xs leading-4 text-gray-700 dark:bg-gray-200-dark dark:text-gray-700-dark">
            <FontAwesomeIcon
              icon={faComment}
              className="text-blue-500 dark:text-blue-500-dark"
            />
            <span className="font-normal">{commentCountFormatted}</span>
          </span>
          <div className="flex h-6 items-center justify-center rounded-xs bg-gray-200 px-1 dark:bg-gray-200-dark">
            <PostStatusIcon
              status={post.status}
              published_at={post.published_at}
              open_time={post.open_time}
              scheduled_close_time={post.scheduled_close_time}
              resolution={resolutionData}
            />
          </div>
          <span className="flex h-6 items-center gap-1 text-xs leading-4 text-gray-700 dark:text-gray-700-dark">
            <FontAwesomeIcon
              icon={faUsers}
              className="text-gray-400 dark:text-gray-400-dark"
            />
            <span className="font-normal">{forecastersFormatted}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default SimilarQuestionCard;
