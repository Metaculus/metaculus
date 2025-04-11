"use client";

import { FC } from "react";

import { KeyFactor } from "@/types/comment";

import UpdownKeyFactorItem from "./updown_item";

type Props = {
  keyFactor: KeyFactor;
  linkToComment?: boolean;
};

// TODO: refactor to use posthog flag and return different types of item based on it
// in general make it entry point for key factor items
export const KeyFactorItem: FC<Props> = ({
  keyFactor,
  linkToComment = true,
}) => {
  const linkAnchor = linkToComment
    ? `#comment-${keyFactor.comment_id}`
    : "#key-factors";

  return <UpdownKeyFactorItem keyFactor={keyFactor} linkAnchor={linkAnchor} />;
};

export default KeyFactorItem;
