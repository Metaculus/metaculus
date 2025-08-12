"use client";

import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { setExcludedFromWeekTopComments } from "@/app/(main)/questions/actions";
import CommentCard from "@/components/comment_feed/comment_card";
import Button from "@/components/ui/button";
import { CommentOfWeekType } from "@/types/comment";
import { CurrentUser } from "@/types/users";
import cn from "@/utils/core/cn";

import Trophy from "./trophy";

type Props = {
  comment: CommentOfWeekType;
  placement: number | null;
  currentUser: CurrentUser | null;
  onExcludeToggleFinished: (commentId: number) => void;
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
  comment,
  placement,
  currentUser,
  onExcludeToggleFinished,
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
  const getBorderClass = (placement: number) => {
    if (placement === 1) {
      return "border-yellow-500 dark:border-yellow-500/40";
    }
    return "border-blue-500 dark:border-blue-500-dark"; // Default blue border
  };

  const handleExclude = async () => {
    if (isProcessing) return;

    setIsExcluding(true);
    try {
      await setExcludedFromWeekTopComments(comment.id, !comment.excluded);
      onExcludeToggleFinished(comment.id);
    } catch (error) {
      console.error("Error excluding comment:", error);
    } finally {
      setIsExcluding(false);
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded border bg-white dark:bg-gray-0-dark",
        placement && getBorderClass(placement)
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
      {/* Admin exclude button */}
      {isAdmin && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExclude}
          disabled={isProcessing}
          className="absolute right-4 top-4 z-10 rounded-full border border-gray-800 bg-white px-3 py-2 dark:border-gray-800-dark dark:bg-gray-0-dark"
        >
          {comment.excluded ? t("unexclude") : t("exclude")}
        </Button>
      )}

      {/* Placement header */}
      <div className="flex items-center gap-3 px-3 pb-0 pt-3 md:px-4 md:pt-4">
        {placement && <Trophy type={getTrophyType(placement)} />}
        <span
          className={cn(
            "text-base font-normal leading-6",
            placement && getPlacementColor(placement)
          )}
        >
          {placement ? getPlacementText(placement, t) : "Excluded"}
        </span>
      </div>

      <CommentCard
        comment={comment}
        className="mt-3 border-t border-gray-300  dark:border-gray-300-dark  md:mt-4"
      />
    </div>
  );
};

export default HighlightedCommentCard;
