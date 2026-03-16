"use client";

import { faPlus, faBan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { setExcludedFromWeekTopComments } from "@/app/(main)/questions/actions";
import CommentCard from "@/components/comment_feed/comment_card";
import CommentPostPreview from "@/components/comment_feed/comment_post_preview";
import SquareArrowUpRight from "@/components/comment_feed/SquareArrowUpRight";
import Button from "@/components/ui/button";
import { CommentOfWeekEntry } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { CurrentUser } from "@/types/users";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";

import Trophy from "./trophy";

type Props = {
  commentEntry: CommentOfWeekEntry;
  placement: number | null;
  currentUser: CurrentUser | null;
  onExcludeToggleFinished: (commentId: number, excluded: boolean) => void;
  expandOverride?: "auto" | "expanded" | "collapsed";
  post?: PostWithForecasts;
  isLoadingPosts?: boolean;
};

const getTrophyType = (placement: number) => {
  if (placement === 1) return "gold";
  if (placement <= 3) return "silver";
  return "bronze";
};

const getPlacementText = (
  placement: number,
  t: ReturnType<typeof useTranslations>
) => {
  if (placement === 1) return t("placementFirst");
  if (placement === 2) return t("placementSecond");
  if (placement === 3) return t("placementThird");
  return t("placementOther", { placement });
};

const getPlacementColor = (placement: number) => {
  const trophyType = getTrophyType(placement);
  switch (trophyType) {
    case "gold":
      return "text-yellow-700 dark:text-yellow-500"; // Gold - matches trophy
    case "silver":
      return "text-gray-600 dark:text-gray-600-dark"; // Silver - matches trophy
    case "bronze":
      return "text-orange-700 dark:text-orange-700-dark"; // Bronze - matches trophy
    default:
      return "text-gray-600 dark:text-gray-600-dark"; // Fallback
  }
};

const HighlightedCommentCard: FC<Props> = ({
  commentEntry: {
    comment,
    changed_my_mind_count,
    excluded,
    votes_score,
    key_factor_votes_score,
  },
  placement,
  currentUser,
  onExcludeToggleFinished,
  expandOverride = "auto",
  post,
}) => {
  const [isProcessing, setIsExcluding] = useState(false);
  const t = useTranslations();

  const isAdmin = currentUser?.is_staff || currentUser?.is_superuser;

  // Get blur circle color based on placement (matches trophy colors)
  const getBlurColor = (placement: number) => {
    const trophyType = getTrophyType(placement);
    switch (trophyType) {
      case "gold":
        return "rgb(234 179 8 / 0.12)"; // yellow-500 with opacity
      case "silver":
        return "rgb(107 114 128 / 0.1)"; // gray-500 with opacity
      case "bronze":
        return "rgb(234 88 12 / 0.07)"; // orange-600 with opacity
      default:
        return "rgb(59 130 246 / 0.1)"; // blue-500 with opacity
    }
  };

  // Get border classes - only gold gets special border, others use default blue
  const getBorderClass = (placement: number | null) => {
    if (placement === 1) {
      return "border-yellow-500 dark:border-yellow-500/40";
    }
    return "border-blue-500 dark:border-blue-500-dark"; // Default blue border
  };

  const handleExclude = async () => {
    if (isProcessing) return;

    setIsExcluding(true);
    try {
      await setExcludedFromWeekTopComments(comment.id, !excluded);
      onExcludeToggleFinished(comment.id, !excluded);
    } catch (error) {
      console.error("Error excluding comment:", error);
    } finally {
      setIsExcluding(false);
    }
  };

  const handleGoToComment = () => {
    const postLink = post
      ? getPostLink(post)
      : comment.on_post_data
        ? `/questions/${comment.on_post_data.id}/`
        : null;
    if (postLink) {
      window.open(`${postLink}#comment-${comment.id}`, "_blank");
    }
  };

  return (
    <div className="relative overflow-hidden rounded bg-white dark:bg-gray-0-dark">
      <div className="flex flex-col md:flex-row">
        {comment.on_post_data && (
          <div
            className={cn(
              "hidden items-start rounded-l border border-blue-500 dark:border-blue-500-dark md:flex md:w-[280px] md:shrink-0",
              placement === 1
                ? "border-r-yellow-500 dark:border-r-yellow-500/40"
                : "border-r-blue-400 dark:border-r-blue-400-dark"
            )}
          >
            <CommentPostPreview
              post={post}
              postTitle={comment.on_post_data.title}
              postId={comment.on_post_data.id}
            />
          </div>
        )}

        {/* Right column: Comment content */}
        <div
          className={cn(
            "relative flex w-full min-w-0 flex-col overflow-hidden rounded border md:rounded-l-none md:border-l-0",
            getBorderClass(placement)
          )}
        >
          {/* Blur circle - only for 1st place */}
          {placement === 1 && (
            <div className="absolute left-0 top-0 overflow-visible">
              {/* Gold blur circle */}
              <div
                className="absolute size-[400px] rounded-full blur-3xl"
                style={{
                  top: "-250px",
                  left: "-250px",
                  backgroundColor: getBlurColor(placement),
                }}
              ></div>
            </div>
          )}

          {/* Placement header */}
          <div className="flex items-center justify-between gap-3 px-3 pb-0 pt-3 md:px-4 md:pt-4">
            <div className="flex items-center gap-3">
              {placement && placement <= 6 && (
                <Trophy type={getTrophyType(placement)} />
              )}
              {placement ? (
                <span
                  className={cn(
                    "text-base font-normal leading-6",
                    getPlacementColor(placement)
                  )}
                >
                  {getPlacementText(placement, t)}
                </span>
              ) : (
                <span
                  className={cn(
                    "py-1 text-base font-bold leading-6 text-gray-800 dark:text-gray-800-dark"
                  )}
                >
                  {t("excluded")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="text"
                onClick={handleGoToComment}
                size="sm"
                className="gap-2 border-none px-2.5 py-1 font-normal text-blue-700  dark:text-blue-700-dark"
              >
                <SquareArrowUpRight className="size-[14px] text-blue-600 dark:text-blue-600-dark md:size-[11px]" />
                <span className="leading-4">{t("view")}</span>
              </Button>
              {/* Admin exclude button */}
              {isAdmin && (
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={handleExclude}
                  disabled={isProcessing}
                  className="gap-2 rounded-sm px-2.5 py-1"
                >
                  {excluded ? (
                    <>
                      <FontAwesomeIcon icon={faPlus} />
                      <span>{t("unexclude")}</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faBan} />
                      <span>{t("exclude")}</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <CommentCard
            comment={comment}
            changedMyMindCount={changed_my_mind_count}
            keyFactorVotesScore={key_factor_votes_score}
            votesScore={votes_score}
            className="mt-0 border-t border-none dark:border-none md:mt-0"
            expandOverride={expandOverride}
          />
        </div>
      </div>
    </div>
  );
};

export default HighlightedCommentCard;
