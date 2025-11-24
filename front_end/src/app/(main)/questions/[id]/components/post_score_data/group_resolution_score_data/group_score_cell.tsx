import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  userScore: number | null | undefined;
  communityScore: number | null | undefined;
};

const GroupScoreCell: FC<Props> = ({ userScore, communityScore }) => {
  const t = useTranslations();

  const formatScore = (score: number) => {
    const sign = score > 0 ? "+" : "";
    return `${sign}${score.toFixed(1)}`;
  };

  const getScoreColor = (score: number) => {
    if (score > 0) return "text-olive-800 dark:text-olive-800-dark";
    if (score < 0) return "text-salmon-800 dark:text-salmon-800-dark";
    return "text-gray-500 dark:text-gray-500-dark";
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      {/* User Score */}
      <div className="text-sm leading-4">
        {!isNil(userScore) ? (
          <span className={cn("font-semibold", getScoreColor(userScore))}>
            {formatScore(userScore)}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500-dark">—</span>
        )}
      </div>

      {/* Community Score */}
      <div className="text-[10px] font-normal capitalize leading-3 text-gray-600 dark:text-gray-600-dark">
        {!isNil(communityScore) ? (
          <>
            {t("community")}:{" "}
            <span className={cn("font-bold", getScoreColor(communityScore))}>
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
