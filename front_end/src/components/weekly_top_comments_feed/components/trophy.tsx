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
        background: "bg-yellow-200/75 dark:bg-yellow-200-dark/75",
        icon: "text-yellow-700 dark:text-yellow-700-dark",
        border: "border-yellow-500 dark:border-yellow-500-dark",
      };
    case "silver":
      return {
        background: "bg-gray-200 dark:bg-gray-200-dark",
        icon: "text-gray-600 dark:text-gray-600-dark",
        border: "border-gray-400 dark:border-gray-400-dark",
      };
    case "bronze":
      return {
        background: "bg-orange-200/50 dark:bg-orange-200-dark/50",
        icon: "text-orange-700 dark:text-orange-700-dark",
        border: "border-orange-500 dark:border-orange-500-dark",
      };
  }
};

const Trophy: FC<Props> = ({ type, className }) => {
  const styles = getTrophyStyles(type);

  return (
    <div
      className={cn(
        "flex size-8 items-center justify-center rounded-sm border",
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
