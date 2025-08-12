"use client";

import { faAward } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import cn from "@/utils/core/cn";

type TrophyType = "gold" | "silver" | "bronze";

type Props = {
  type: TrophyType;
  className?: string;
};

const getTrophyStyles = (type: TrophyType) => {
  switch (type) {
    case "gold":
      return {
        background: "bg-yellow-200/75 dark:bg-gray-800/10",
        icon: "text-yellow-700 dark:text-yellow-400",
        border: "border-yellow-500 dark:border-yellow-500",
      };
    case "silver":
      return {
        background: "bg-gray-200 dark:bg-gray-800/10",
        icon: "text-gray-600 dark:text-gray-600-dark",
        border: "border-gray-400 dark:border-gray-400-dark",
      };
    case "bronze":
      return {
        background: "bg-orange-200/50 dark:bg-gray-800/10",
        icon: "text-orange-700 dark:text-orange-500",
        border: "border-orange-500/50 dark:border-orange-500",
      };
  }
};

const Trophy: FC<Props> = ({ type, className }) => {
  const styles = getTrophyStyles(type);

  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-md border",
        styles.background,
        styles.border,
        className
      )}
    >
      <FontAwesomeIcon icon={faAward} className={cn("text-lg", styles.icon)} />
    </div>
  );
};

export default Trophy;
