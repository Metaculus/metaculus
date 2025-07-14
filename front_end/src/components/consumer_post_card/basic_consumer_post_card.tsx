import { isNil } from "lodash";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import CommunityDisclaimer from "@/components/post_card/community_disclaimer";
import { PostWithForecasts } from "@/types/post";
import { TournamentType } from "@/types/projects";
import { getPostLink } from "@/utils/navigation";

type Props = {
  post: PostWithForecasts;
  forCommunityFeed?: boolean;
};

const BasicConsumerPostCard: FC<PropsWithChildren<Props>> = ({
  post,
  forCommunityFeed,
  children,
}) => {
  const { title } = post;

  return (
    <div>
      {!isNil(forCommunityFeed) &&
        forCommunityFeed !==
          (post.projects.default_project.type === TournamentType.Community) && (
          <CommunityDisclaimer
            project={post.projects.default_project}
            variant="inline"
          />
        )}
      <div className="relative flex flex-col items-center gap-2.5 overflow-hidden rounded border border-blue-400 bg-gray-0 p-6 pt-5 no-underline @container dark:border-blue-400-dark dark:bg-gray-0-dark">
        <div className="z-10 flex items-center justify-between rounded-ee rounded-es dark:border-blue-400-dark max-lg:flex-1">
          <CommentStatus
            totalCount={post.comment_count ?? 0}
            unreadCount={post.unread_comment_count ?? 0}
            url={getPostLink(post)}
          />
          <ForecastersCounter forecasters={post.nr_forecasters} />
        </div>
        <div
          className={
            "flex w-full flex-col items-center gap-5 overflow-hidden no-underline @container"
          }
        >
          <h4 className="m-0 max-w-xl text-center text-lg font-medium">
            {title}
          </h4>
          {children}
        </div>
        <Link
          href={getPostLink(post)}
          className="absolute top-0 z-0 h-full w-full @container"
        ></Link>
      </div>
    </div>
  );
};

export default BasicConsumerPostCard;
