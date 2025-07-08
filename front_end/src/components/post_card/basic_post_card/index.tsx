"use client";

import { isNil } from "lodash";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import CommunityDisclaimer from "@/components/post_card/community_disclaimer";
import PostDefaultProject from "@/components/post_default_project";
import PostStatus from "@/components/post_status";
import { Post } from "@/types/post";
import { TournamentType } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";
import { extractPostResolution } from "@/utils/questions/resolution";

import CommentStatus from "./comment_status";
import PostVoter from "./post_voter";

type BorderVariant = "regular" | "highlighted";
type BorderColor = "blue" | "purple";

type Props = {
  post: Post;
  hideTitle?: boolean;
  borderVariant?: BorderVariant;
  borderColor?: BorderColor;
  forCommunityFeed?: boolean;
};

const BasicPostCard: FC<PropsWithChildren<Props>> = ({
  post,
  hideTitle = false,
  borderVariant = "regular",
  borderColor = "blue",
  children,
  forCommunityFeed,
}) => {
  const { title } = post;
  const resolutionData = extractPostResolution(post);
  const defaultProject = post.projects.default_project;

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
          "rounded bg-gray-0 dark:bg-gray-0-dark",
          { regular: "border", highlighted: "border border-l-4" }[
            borderVariant
          ],
          {
            blue: "border-blue-400 dark:border-blue-400",
            purple: "border-purple-500 dark:border-purple-500",
          }[borderColor]
        )}
      >
        <Link href={getPostLink(post)} className="block px-5 py-4 no-underline">
          {!hideTitle && (
            <h4 className="relative mb-4 mt-0 text-base font-medium text-gray-800 dark:text-gray-800-dark">
              {title}
            </h4>
          )}
          {children}
        </Link>
        <div className="flex items-center justify-between rounded-ee rounded-es border-t border-blue-400  px-2 py-0.5 font-medium dark:border-blue-400-dark max-lg:flex-1">
          <div className="flex items-center gap-3">
            <PostVoter post={post} />
            <CommentStatus
              totalCount={post.comment_count ?? 0}
              unreadCount={post.unread_comment_count ?? 0}
              url={getPostLink(post)}
            />
            <PostStatus post={post} resolution={resolutionData} />
            <ForecastersCounter forecasters={post.nr_forecasters} />
          </div>
          <div className="hidden lg:inline-flex">
            <PostDefaultProject defaultProject={defaultProject} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicPostCard;
