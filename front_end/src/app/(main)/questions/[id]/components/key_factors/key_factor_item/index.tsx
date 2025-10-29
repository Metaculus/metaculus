"use client";

import dynamic from "next/dynamic";
import { FC } from "react";

import { KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import cn from "@/utils/core/cn";

import KeyFactorDriver from "./key_factor_driver";

type Props = {
  id: string;
  keyFactor: KeyFactor;
  linkToComment?: boolean;
  isCompact?: boolean;
  mode?: "forecaster" | "consumer";
  onClick?: () => void;
  className?: string;
  projectPermission?: ProjectPermissions;
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
}) => {
  const isCompactConsumer = mode === "consumer" && isCompact;

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
    </div>
  );
};

export default dynamic(() => Promise.resolve(KeyFactorItem), {
  ssr: false,
});
