"use client";

import dynamic from "next/dynamic";
import { FC } from "react";

import { KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";

import KeyFactorDriver from "./key_factor_driver";

type Props = {
  keyFactor: KeyFactor;
  post: PostWithForecasts;
  linkToComment?: boolean;
  variant?: "default" | "compact";
};

export const KeyFactorItem: FC<Props> = ({
  keyFactor,
  post,
  linkToComment = true,
  variant = "default",
}) => {
  const linkAnchor = linkToComment
    ? `#comment-${keyFactor.comment_id}`
    : "#key-factors";

  if (keyFactor.driver) {
    return (
      <KeyFactorDriver
        keyFactor={keyFactor}
        linkAnchor={linkAnchor}
        linkToComment={linkToComment}
        variant={variant}
        post={post}
      />
    );
  }
};

export default dynamic(() => Promise.resolve(KeyFactorItem), {
  ssr: false,
});
