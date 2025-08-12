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
  placement: number;
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
  if (placement === 1) return "text-orange-700 dark:text-orange-700-dark";
  return "text-gray-600 dark:text-gray-600-dark";
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
    <div className="relative overflow-hidden rounded border border-blue-500 bg-white dark:border-blue-500-dark dark:bg-gray-0-dark">
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
        <Trophy type={getTrophyType(placement)} />
        <span
          className={cn(
            "text-base font-normal leading-6",
            getPlacementColor(placement)
          )}
        >
          {getPlacementText(placement, t)}
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
