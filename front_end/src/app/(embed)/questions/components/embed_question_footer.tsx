import Image from "next/image";
import Link from "next/link";
import React, { useMemo } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import { PostWithForecasts } from "@/types/post";
import { getPostLink } from "@/utils/navigation";

import metaculusDarkLogo from "../assets/metaculus-dark.png";
import metaculusLightLogo from "../assets/metaculus-light.png";

type Props = {
  post: PostWithForecasts;
  ogReady?: boolean;
};

const EmbedQuestionFooter: React.FC<Props> = ({ post, ogReady }) => {
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
          url={""}
        />
      </div>

      {ogReady && (
        <Link
          href={questionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          aria-label="Open on Metaculus"
        >
          <div id="id-logo-used-by-screenshot-donot-change">
            <Image
              className="dark:hidden"
              src={metaculusDarkLogo}
              alt="Metaculus Logo"
              width={74}
              height={15}
            />
            <Image
              className="hidden dark:block"
              src={metaculusLightLogo}
              alt="Metaculus Logo"
              width={74}
              height={15}
            />
          </div>
        </Link>
      )}
    </div>
  );
};

export default EmbedQuestionFooter;
