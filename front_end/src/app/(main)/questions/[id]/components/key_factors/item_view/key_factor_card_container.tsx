"use client";

import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import { ImpactDirection } from "@/types/comment";
import cn from "@/utils/core/cn";

import VerticalImpactBar from "./vertical_impact_bar";

type Props = {
  id?: string;
  children: ReactNode;
  isFlagged?: boolean;
  linkToComment?: boolean;
  isCompact?: boolean;
  mode?: "forecaster" | "consumer";
  onClick?: () => void;
  className?: string;
  impactDirection?: ImpactDirection | null;
  impactStrength?: number;
};

const KeyFactorCardContainer: FC<Props> = ({
  id,
  children,
  isFlagged,
  linkToComment = true,
  isCompact,
  mode: _mode,
  onClick,
  className,
  impactDirection,
  impactStrength = 0,
}) => {
  const t = useTranslations();

  if (isFlagged) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded border border-gray-0 bg-salmon-100 p-3 text-sm text-salmon-800 dark:border-gray-0-dark dark:bg-salmon-100-dark dark:text-salmon-800-dark",
          className
        )}
      >
        <FontAwesomeIcon icon={faExclamationTriangle} />
        {t("youFlaggedThisAsSpam")}
      </div>
    );
  }

  const showImpactBar = impactDirection !== undefined;

  return (
    <div
      id={id}
      onClick={onClick}
      className={cn(
        "relative flex gap-3 overflow-hidden rounded-xl p-5 [&:hover_.target]:visible",
        linkToComment
          ? "border border-blue-400 bg-gray-0 dark:border-blue-400-dark dark:bg-gray-0-dark"
          : "bg-blue-200 dark:bg-blue-200-dark",
        {
          "cursor-pointer hover:border-blue-500 dark:hover:border-blue-500-dark":
            !!onClick,
        },
        isCompact && "p-4",
        className
      )}
    >
      {showImpactBar && (
        <VerticalImpactBar
          direction={impactDirection}
          strength={impactStrength}
          size={isCompact ? "narrow" : "default"}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-3">{children}</div>
    </div>
  );
};

export default KeyFactorCardContainer;
