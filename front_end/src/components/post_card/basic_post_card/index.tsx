"use client";

import { isNil } from "lodash";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import WeightBadge from "@/app/(main)/(tournaments)/tournament/components/index/index_weight_badge";
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
  indexWeight?: number;
};

const BasicPostCard: FC<PropsWithChildren<Props>> = ({
  post,
  hideTitle = false,
  borderVariant = "regular",
  borderColor = "blue",
  children,
  forCommunityFeed,
  indexWeight,
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
          "overflow-hidden rounded bg-gray-0 px-5 py-4 dark:bg-gray-0-dark",
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
            <div className="mb-[18px] flex flex-col gap-[10px] sm:mb-0 sm:flex-row sm:gap-3">
              <h4 className="relative mb-0 mt-0 text-base font-semibold text-gray-900 dark:text-gray-900-dark sm:mb-3">
                {title}
              </h4>
              {typeof indexWeight === "number" && (
                <div className="sm:ml-auto">
                  <WeightBadge value={indexWeight} />
                </div>
              )}
            </div>
          )}
          {children}
        </Link>
        <BasicPostControls post={post} />
      </div>
    </div>
  );
};

export default BasicPostCard;
