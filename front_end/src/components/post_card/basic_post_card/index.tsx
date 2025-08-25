"use client";

import { isNil } from "lodash";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import BasicPostControls from "@/components/post_card/basic_post_card/post_controls";
import CommunityDisclaimer from "@/components/post_card/community_disclaimer";
import { Post } from "@/types/post";
import { TournamentType } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";

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
          "rounded bg-gray-0 px-5 py-4 dark:bg-gray-0-dark",
          { regular: "border", highlighted: "border border-l-4" }[
            borderVariant
          ],
          {
            blue: "border-blue-400 dark:border-blue-400-dark",
            purple: "border-purple-500 dark:border-purple-500-dark",
          }[borderColor]
        )}
      >
        <Link href={getPostLink(post)} className="block no-underline">
          {!hideTitle && (
            <h4 className="relative mb-4 mt-0 text-base font-medium text-gray-800 dark:text-gray-800-dark">
              {title}
            </h4>
          )}
          {children}
        </Link>
        <BasicPostControls post={post} />
      </div>
    </div>
  );
};

export default BasicPostCard;
