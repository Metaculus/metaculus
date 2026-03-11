"use client";

import dynamic from "next/dynamic";
import { FC } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { ImpactMetadata, KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import { getImpactDirectionFromMetadata } from "@/utils/key_factors";

import KeyFactorBaseRate from "./base_rate/key_factor_base_rate";
import KeyFactorDriver from "./driver/key_factor_driver";
import KeyFactorCardContainer from "./key_factor_card_container";
import KeyFactorVotePanels, {
  useKeyFactorVotePanels,
} from "./key_factor_vote_panels";
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
  inlineVotePanels?: boolean;
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
  inlineVotePanels,
}) => {
  const { combinedKeyFactors } = useCommentsFeed();
  const liveKeyFactor =
    combinedKeyFactors.find((kf) => kf.id === keyFactor.id) ?? keyFactor;

  const isFlagged = liveKeyFactor.flagged_by_me;
  const hasImpactBar = !liveKeyFactor.base_rate;
  const impactDirection = hasImpactBar
    ? getImpactDirectionFromMetadata(getImpactMetadata(liveKeyFactor))
    : undefined;
  const impactStrength = liveKeyFactor.vote?.score ?? 0;

  const {
    impactPanel,
    downvotePanel,
    morePanel,
    handleUpvotePanelToggle,
    handleDownvotePanelToggle,
    handleMorePanelToggle,
  } = useKeyFactorVotePanels();

  return (
    <div ref={impactPanel.anchorRef} className="self-start">
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
        {liveKeyFactor.driver && (
          <KeyFactorDriver
            keyFactor={liveKeyFactor}
            mode={mode}
            isCompact={isCompact}
            onVotePanelToggle={handleUpvotePanelToggle}
            onDownvotePanelToggle={handleDownvotePanelToggle}
            onMorePanelToggle={handleMorePanelToggle}
            isMorePanelOpen={morePanel.showPanel}
          />
        )}
        {liveKeyFactor.base_rate && (
          <KeyFactorBaseRate
            keyFactor={liveKeyFactor}
            isCompact={isCompact}
            mode={mode}
            isSuggested={isSuggested}
            onVotePanelToggle={handleUpvotePanelToggle}
            onDownvotePanelToggle={handleDownvotePanelToggle}
            onMorePanelToggle={handleMorePanelToggle}
            isMorePanelOpen={morePanel.showPanel}
          />
        )}
        {liveKeyFactor.news && (
          <KeyFactorNews
            keyFactor={liveKeyFactor}
            mode={mode}
            isCompact={isCompact}
            onVotePanelToggle={handleUpvotePanelToggle}
            onDownvotePanelToggle={handleDownvotePanelToggle}
            onMorePanelToggle={handleMorePanelToggle}
            isMorePanelOpen={morePanel.showPanel}
          />
        )}
      </KeyFactorCardContainer>

      <KeyFactorVotePanels
        impactPanel={impactPanel}
        downvotePanel={downvotePanel}
        morePanel={morePanel}
        anchorRef={impactPanel.anchorRef}
        isCompact={isCompact}
        inline={inlineVotePanels}
        keyFactor={liveKeyFactor}
        projectPermission={projectPermission}
      />
    </div>
  );
};

export default dynamic(() => Promise.resolve(KeyFactorItem), {
  ssr: false,
});
