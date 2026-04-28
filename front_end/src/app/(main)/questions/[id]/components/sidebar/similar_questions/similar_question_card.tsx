import { faComment } from "@fortawesome/free-regular-svg-icons";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import RichText from "@/components/rich_text";
import { PostWithForecasts } from "@/types/post";
import { abbreviatedNumber } from "@/utils/formatters/number";
import { getPostLink } from "@/utils/navigation";

import SimilarPredictionChip from "./similar_question_prediction_chip";

type Props = {
  post: PostWithForecasts;
};

const SimilarQuestionCard: FC<Props> = ({ post }) => {
  const t = useTranslations();

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

  return (
    <Link href={getPostLink(post)} className="w-full no-underline">
      <div className="flex flex-col gap-3 rounded border border-blue-400 bg-gray-0 px-3 py-4 dark:border-blue-400-dark dark:bg-gray-0-dark">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-700 dark:text-gray-700-dark">
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon
              icon={faComment}
              className="text-gray-700 dark:text-gray-700-dark"
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
              className="text-gray-700 dark:text-gray-700-dark"
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

        <h4 className="my-0 text-center text-base font-medium leading-6 text-gray-800 dark:text-gray-800-dark">
          {post.title}
        </h4>

        <SimilarPredictionChip post={post} />
      </div>
    </Link>
  );
};

export default SimilarQuestionCard;
