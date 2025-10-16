"use client";

import dynamic from "next/dynamic";
import { FC } from "react";

import { KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import KeyFactorDriver from "./key_factor_driver";

type Props = {
  keyFactor: KeyFactor;
  post: PostWithForecasts;
  linkToComment?: boolean;
  isCompact?: boolean;
  mode?: "forecaster" | "consumer";
  onClick?: () => void;
};

export const KeyFactorItem: FC<Props> = ({
  keyFactor,
  post,
  linkToComment = true,
  isCompact,
  mode,
  onClick,
}) => {
  const linkAnchor = linkToComment
    ? `#comment-${keyFactor.comment_id}`
    : "#key-factors";

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
        }
      )}
      onClick={onClick}
    >
      {keyFactor.driver && (
        <KeyFactorDriver
          keyFactor={keyFactor}
          linkAnchor={linkAnchor}
          linkToComment={linkToComment}
          mode={mode}
          isCompact={isCompact}
          post={post}
        />
      )}
    </div>
  );
};

export default dynamic(() => Promise.resolve(KeyFactorItem), {
  ssr: false,
});
