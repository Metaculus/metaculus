import { isNil } from "lodash";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import WeightBadge from "@/app/(main)/(tournaments)/tournament/components/index/index_weight_badge";
import { CoherenceLinksProvider } from "@/app/(main)/components/coherence_links_provider";
import KeyFactorsTileView from "@/app/(main)/questions/[id]/components/key_factors/questions_feed_view/key_factors_tile_view";
import ParticipationSummaryQuestionTile from "@/app/(main)/questions/[id]/components/post_score_data/participation_summary_question_tile";
import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import CommunityDisclaimer from "@/components/post_card/community_disclaimer";
import { PostWithForecasts } from "@/types/post";
import { TournamentType } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";
import { isQuestionPost } from "@/utils/questions/helpers";

type Props = {
  post: PostWithForecasts;
  forCommunityFeed?: boolean;
  indexWeight?: number;
  isNotebook?: boolean;
};

const BasicConsumerPostCard: FC<PropsWithChildren<Props>> = ({
  post,
  forCommunityFeed,
  indexWeight,
  isNotebook = false,
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
      <div
        className={cn(
          "rounded border no-underline @container",
          isNotebook
            ? "gap-1 border-purple-400/50 bg-purple-50/75 p-4 pt-3 dark:border-purple-400-dark/50  dark:bg-purple-100-dark/40"
            : "gap-2.5 border-blue-400 bg-gray-0 p-6 pt-5 dark:border-blue-400-dark dark:bg-gray-0-dark"
        )}
      >
        <div
          className={cn(
            "relative z-0 flex flex-col items-center overflow-hidden",
            isNotebook ? "gap-1" : "gap-2.5"
          )}
        >
          <div className="flex items-center justify-between rounded-ee rounded-es dark:border-blue-400-dark max-lg:flex-1">
            <CommentStatus
              totalCount={post.comment_count ?? 0}
              unreadCount={post.unread_comment_count ?? 0}
              url={getPostLink(post)}
              variant="gray"
              className="z-[101]"
            />
            <ForecastersCounter forecasters={post.nr_forecasters} />
          </div>
          <div
            className={
              "flex w-full flex-col items-center gap-5 overflow-hidden no-underline @container"
            }
          >
            <h4
              className={cn(
                "m-0 max-w-xl text-center",
                isNotebook
                  ? "text-sm font-medium text-purple-900 dark:text-purple-900-dark md:text-base"
                  : "text-base font-medium md:text-lg"
              )}
            >
              {title}
            </h4>
            {typeof indexWeight === "number" && (
              <div className="flex justify-center">
                <WeightBadge value={indexWeight} />
              </div>
            )}
            {children}
          </div>
          <Link
            href={getPostLink(post)}
            className="absolute top-0 z-100 h-full w-full @container"
          ></Link>
        </div>

        {isQuestionPost(post) && (
          <CoherenceLinksProvider post={post}>
            <KeyFactorsTileView post={post} className="mt-[28px]" />
          </CoherenceLinksProvider>
        )}
        {isQuestionPost(post) && (
          <ParticipationSummaryQuestionTile post={post} />
        )}
      </div>
    </div>
  );
};

export default BasicConsumerPostCard;
