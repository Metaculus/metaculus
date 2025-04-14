"use client";

import { FC } from "react";

import { KeyFactor } from "@/types/comment";

import LikertKeyFactorItem from "./likert_item";
import TwoStepKeyFactorItem from "./two_step_item";
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
  if (false) {
    return (
      <UpdownKeyFactorItem
        keyFactor={keyFactor}
        linkAnchor={linkAnchor}
        linkToComment={linkToComment}
      />
    );
  }
  return (
    <TwoStepKeyFactorItem
      keyFactor={keyFactor}
      linkToComment={linkToComment}
      linkAnchor={linkAnchor}
    />
  );
  return (
    <LikertKeyFactorItem
      keyFactor={keyFactor}
      linkToComment={linkToComment}
      linkAnchor={linkAnchor}
    />
  );
};

export default KeyFactorItem;
