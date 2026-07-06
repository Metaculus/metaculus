import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
};

const USER_SCORE_CLASS = "text-orange-800 dark:text-orange-800-dark";
const COMMUNITY_SCORE_CLASS = "text-olive-800 dark:text-olive-800-dark";

const GroupScoreCell: FC<Props> = ({ userScore, communityScore }) => {
  const t = useTranslations();

  const formatScore = (score: number) => {
    const sign = score > 0 ? "+" : "";
    return `${sign}${score.toFixed(1)}`;
  };

  const hasUserScore = !isNil(userScore);
  const hasCommunityScore = !isNil(communityScore);

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      {/* User Score */}
      {hasUserScore && (
        <div className="text-sm leading-4">
          <span className={cn("font-semibold", USER_SCORE_CLASS)}>
            {formatScore(userScore)}
          </span>
        </div>
      )}

      {/* Community Score */}
      <div
        className={cn("transition-all", {
          "text-[10px] font-normal leading-3": hasUserScore,
          "flex flex-col items-center gap-0.5 text-sm leading-4": !hasUserScore,
        })}
      >
        {hasCommunityScore ? (
          <>
            <span
              className={cn({
                "text-gray-600 dark:text-gray-600-dark": hasUserScore,
                "font-medium capitalize text-gray-500 dark:text-gray-500-dark":
                  !hasUserScore,
              })}
            >
              {t("community")}:
            </span>
            <span
              className={cn(COMMUNITY_SCORE_CLASS, {
                "font-semibold": hasUserScore,
                "text-sm font-semibold": !hasUserScore,
              })}
            >
              {formatScore(communityScore)}
            </span>
          </>
        ) : (
          <span className="text-gray-400 dark:text-gray-500-dark">—</span>
        )}
      </div>
    </div>
  );
};

export default GroupScoreCell;
