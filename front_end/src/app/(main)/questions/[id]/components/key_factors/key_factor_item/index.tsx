"use client";

import { FC } from "react";

import { KeyFactor } from "@/types/comment";

import TwoStepKeyFactorItem from "./two_step_item";
// import UpdownKeyFactorItem from "./updown_item";
// import MultiVoteKeyFactorItem from "./multi_vote_item";
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

  return (
    <TwoStepKeyFactorItem
      keyFactor={keyFactor}
      // linkAnchor={linkAnchor}
      linkToComment={linkToComment}
    />
  );
};

export default KeyFactorItem;
