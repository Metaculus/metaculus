"use client";

import dynamic from "next/dynamic";
import { FC } from "react";

import { KeyFactor } from "@/types/comment";

import KeyFactorDriver from "./key_factor_driver";

type Props = {
  keyFactor: KeyFactor;
  linkToComment?: boolean;
  variant?: "default" | "compact";
};

export const KeyFactorItem: FC<Props> = ({
  keyFactor,
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
      />
    );
  }
};

export default dynamic(() => Promise.resolve(KeyFactorItem), {
  ssr: false,
});
