"use client";

import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, ReactNode } from "react";

import cn from "@/utils/core/cn";

type Mode = "forecaster" | "consumer";

type Props = {
  id?: string;
  children: ReactNode;
  isFlagged?: boolean;
  linkToComment?: boolean;
  isCompact?: boolean;
  mode?: Mode;
  onClick?: () => void;
  className?: string;
};

const KeyFactorCardContainer: FC<Props> = ({
  id,
  children,
  isFlagged,
  linkToComment = true,
  isCompact,
  mode,
  onClick,
  className,
}) => {
  const t = useTranslations();
  const isCompactConsumer = mode === "consumer" && isCompact;

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

  return (
    <div
      id={id}
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-3 rounded border border-transparent bg-blue-200 p-3 dark:bg-blue-200-dark [&:hover_.target]:visible",
        {
          "bg-gray-0 dark:bg-gray-0-dark": linkToComment,
          "max-w-[280px]": isCompact || mode === "consumer",
          "max-w-[164px]": isCompactConsumer,
          "rounded-xl bg-blue-200 p-5 dark:bg-blue-200-dark":
            mode === "consumer",
          "p-4": isCompactConsumer,
          "cursor-pointer hover:border-blue-500 dark:hover:border-blue-500-dark":
            !!onClick,
        },
        className
      )}
    >
      {children}
    </div>
  );
};

export default KeyFactorCardContainer;
