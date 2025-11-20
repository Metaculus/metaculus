"use client";

import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import cn from "@/utils/core/cn";

import KeyFactorBaseRate from "./base_rate/key_factor_base_rate";
import KeyFactorDriver from "./driver/key_factor_driver";
import KeyFactorNews from "./news/key_factor_news";

type Props = {
  id?: string;
  keyFactor: KeyFactor;
  linkToComment?: boolean;
  isCompact?: boolean;
  mode?: "forecaster" | "consumer";
  onClick?: () => void;
  className?: string;
  projectPermission?: ProjectPermissions;
  isSuggested?: boolean;
};

export const KeyFactorItem: FC<Props> = ({
  id,
  keyFactor,
  linkToComment = true,
  isCompact,
  mode,
  onClick,
  className,
  projectPermission,
  isSuggested,
}) => {
  const t = useTranslations();
  const isCompactConsumer = mode === "consumer" && isCompact;

  if (keyFactor.flagged_by_me) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded border border-gray-0 bg-salmon-100 p-3 text-sm  text-salmon-800 dark:border-gray-0-dark dark:bg-salmon-100-dark dark:text-salmon-800-dark",
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
      onClick={onClick}
      id={id}
    >
      {keyFactor.driver && (
        <KeyFactorDriver
          keyFactor={keyFactor}
          mode={mode}
          isCompact={isCompact}
          projectPermission={projectPermission}
        />
      )}
      {keyFactor.base_rate && (
        <KeyFactorBaseRate
          keyFactor={keyFactor}
          isCompact={isCompact}
          mode={mode}
          projectPermission={projectPermission}
          isSuggested={isSuggested}
        />
      )}
      {keyFactor.news && (
        <KeyFactorNews
          keyFactor={keyFactor}
          mode={mode}
          isCompact={isCompact}
          projectPermission={projectPermission}
        />
      )}
    </div>
  );
};

export default dynamic(() => Promise.resolve(KeyFactorItem), {
  ssr: false,
});
