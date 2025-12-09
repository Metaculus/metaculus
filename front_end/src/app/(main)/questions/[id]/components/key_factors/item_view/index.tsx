"use client";

import dynamic from "next/dynamic";
import { FC } from "react";

import { KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";

import KeyFactorBaseRate from "./base_rate/key_factor_base_rate";
import KeyFactorDriver from "./driver/key_factor_driver";
import KeyFactorCardContainer from "./key_factor_card_container";
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
  const isFlagged = keyFactor.flagged_by_me;

  return (
    <KeyFactorCardContainer
      id={id}
      isFlagged={isFlagged}
      linkToComment={linkToComment}
      isCompact={isCompact}
      mode={mode}
      onClick={onClick}
      className={className}
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
    </KeyFactorCardContainer>
  );
};

export default dynamic(() => Promise.resolve(KeyFactorItem), {
  ssr: false,
});
