"use client";

import dynamic from "next/dynamic";
import { FC } from "react";

import { ImpactMetadata, KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import { getImpactDirectionFromMetadata } from "@/utils/key_factors";

import KeyFactorBaseRate from "./base_rate/key_factor_base_rate";
import KeyFactorDriver from "./driver/key_factor_driver";
import KeyFactorCardContainer from "./key_factor_card_container";
import KeyFactorNews from "./news/key_factor_news";
import { useVoteImpactPanel } from "./use_vote_impact_panel";
import VoteImpactPanel from "./vote_impact_panel";

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

function getImpactMetadata(keyFactor: KeyFactor): ImpactMetadata | null {
  return keyFactor.driver ?? keyFactor.news ?? null;
}

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
  const hasImpactBar = !keyFactor.base_rate;
  const impactDirection = hasImpactBar
    ? getImpactDirectionFromMetadata(getImpactMetadata(keyFactor))
    : undefined;
  const impactStrength = keyFactor.vote?.score ?? 0;

  const {
    showVotePanel,
    selectedImpact,
    anchorRef,
    panelRef,
    setShowVotePanel,
    closePanel,
    toggleImpact,
  } = useVoteImpactPanel();

  return (
    <div ref={anchorRef}>
      <KeyFactorCardContainer
        id={id}
        isFlagged={isFlagged}
        linkToComment={linkToComment}
        isCompact={isCompact}
        mode={mode}
        onClick={onClick}
        className={className}
        impactDirection={impactDirection}
        impactStrength={impactStrength}
      >
        {keyFactor.driver && (
          <KeyFactorDriver
            keyFactor={keyFactor}
            mode={mode}
            isCompact={isCompact}
            projectPermission={projectPermission}
            onVotePanelToggle={setShowVotePanel}
          />
        )}
        {keyFactor.base_rate && (
          <KeyFactorBaseRate
            keyFactor={keyFactor}
            isCompact={isCompact}
            mode={mode}
            projectPermission={projectPermission}
            isSuggested={isSuggested}
            onVotePanelToggle={setShowVotePanel}
          />
        )}
        {keyFactor.news && (
          <KeyFactorNews
            keyFactor={keyFactor}
            mode={mode}
            isCompact={isCompact}
            projectPermission={projectPermission}
            onVotePanelToggle={setShowVotePanel}
          />
        )}
      </KeyFactorCardContainer>

      {showVotePanel && (
        <VoteImpactPanel
          ref={panelRef}
          selectedOption={selectedImpact}
          isCompact={isCompact}
          anchorRef={anchorRef}
          onSelect={toggleImpact}
          onClose={closePanel}
        />
      )}
    </div>
  );
};

export default dynamic(() => Promise.resolve(KeyFactorItem), {
  ssr: false,
});
