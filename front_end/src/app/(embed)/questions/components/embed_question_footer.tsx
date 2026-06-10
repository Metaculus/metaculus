import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import { MetaculusWordmark } from "@/components/logos";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import { PostWithForecasts } from "@/types/post";
import { getPostLink } from "@/utils/navigation";

type Props = {
  post: PostWithForecasts;
  ogReady?: boolean;
};

const EmbedQuestionFooter: React.FC<Props> = ({ post, ogReady }) => {
  const t = useTranslations();
  const questionUrl = useMemo(() => getPostLink(post), [post]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-y-3">
      <div className="flex items-center gap-2">
        <ForecastersCounter
          className="py-1 pl-0 pr-1.5 [&_strong]:font-normal"
          forecasters={post.nr_forecasters}
        />
        <CommentStatus
          className="!px-1.5 py-1 [&_strong]:font-normal [&_svg]:text-gray-400 [&_svg]:dark:text-gray-400-dark"
          totalCount={post.comment_count ?? 0}
          unreadCount={post.unread_comment_count ?? 0}
          url={questionUrl}
          target="_blank"
          rel="noopener noreferrer"
        />
      </div>

      {ogReady && (
        <Link
          href={questionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          aria-label={t("openOnMetaculus")}
        >
          <div id="id-logo-used-by-screenshot-donot-change">
            <MetaculusWordmark
              aria-hidden
              className="h-[15px] w-auto text-blue-800 dark:text-blue-800-dark"
            />
          </div>
        </Link>
      )}
    </div>
  );
};

export default EmbedQuestionFooter;
