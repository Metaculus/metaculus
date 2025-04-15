"use client";

import { useFeatureFlagVariantKey } from "posthog-js/react";
import { FC } from "react";

import { KeyFactor } from "@/types/comment";

import LikertKeyFactorItem from "./likert_item";
import TwoStepKeyFactorItem from "./two_step_item";
import UpdownKeyFactorItem from "./updown_item";
type Props = {
  keyFactor: KeyFactor;
  linkToComment?: boolean;
};

const FEATURE_FLAG_KEY = "key-factors-p2";
const LAYOUT_VARIANTS = {
  UP_DOWN: "default",
  TWO_STEP: "2-step-survey",
  LIKERT: "likert-scale",
} as const;

export const KeyFactorItem: FC<Props> = ({
  keyFactor,
  linkToComment = true,
}) => {
  const layoutVariant = useFeatureFlagVariantKey(FEATURE_FLAG_KEY);
  const linkAnchor = linkToComment
    ? `#comment-${keyFactor.comment_id}`
    : "#key-factors";

  switch (layoutVariant) {
    case LAYOUT_VARIANTS.TWO_STEP:
      return (
        <TwoStepKeyFactorItem
          keyFactor={keyFactor}
          linkAnchor={linkAnchor}
          linkToComment={linkToComment}
        />
      );
    case LAYOUT_VARIANTS.LIKERT:
      return (
        <LikertKeyFactorItem
          keyFactor={keyFactor}
          linkToComment={linkToComment}
          linkAnchor={linkAnchor}
        />
      );
    default:
      return (
        <UpdownKeyFactorItem
          keyFactor={keyFactor}
          linkAnchor={linkAnchor}
          linkToComment={linkToComment}
        />
      );
  }
};

export default KeyFactorItem;
