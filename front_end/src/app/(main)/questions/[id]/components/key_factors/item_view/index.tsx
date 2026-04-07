"use client";

import { FC, useCallback, useEffect, useRef, useState } from "react";

import { useCommentsFeedSafe } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import { useAuth } from "@/contexts/auth_context";
import {
  ImpactMetadata,
  KeyFactor,
  KeyFactorVoteAggregate,
  KeyFactorVoteTypes,
  StrengthValues,
} from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getImpactDirectionFromMetadata } from "@/utils/key_factors";

import KeyFactorBaseRate from "./base_rate/key_factor_base_rate";
import KeyFactorDriver from "./driver/key_factor_driver";
import KeyFactorCardContainer from "./key_factor_card_container";
import { ImpactVoteHandler } from "./key_factor_strength_item";
import KeyFactorVotePanels, {
  useKeyFactorVotePanels,
} from "./key_factor_vote_panels";
import KeyFactorNews from "./news/key_factor_news";
import {
  API_TO_DOWNVOTE_REASON,
  DOWNVOTE_REASON_TO_API,
  DownvoteReason,
} from "./use_vote_panel";

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
  truncateText?: boolean;
  titleLinksToArticle?: boolean;
  disableHover?: boolean;
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
  truncateText,
  titleLinksToArticle: titleLinksToArticleProp,
  disableHover,
}) => {
  const { user } = useAuth();
  const commentsFeed = useCommentsFeedSafe();
  const liveKeyFactor =
    commentsFeed?.combinedKeyFactors.find((kf) => kf.id === keyFactor.id) ??
    keyFactor;

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
    closeAllPanels,
  } = useKeyFactorVotePanels();

  const impactVoteRef = useRef<ImpactVoteHandler | null>(null);
  const [showDownvoteThanks, setShowDownvoteThanks] = useState(false);

  const userVoteReason = liveKeyFactor.vote?.user_vote_reason;
  const initialReason = userVoteReason
    ? API_TO_DOWNVOTE_REASON[userVoteReason]
    : null;
  const setDownvoteSelectedOption = downvotePanel.setSelectedOption;

  useEffect(() => {
    if (initialReason) {
      setDownvoteSelectedOption(initialReason);
    }
  }, [initialReason, setDownvoteSelectedOption]);

  const wrappedHandleDownvotePanelToggle = useCallback(
    (open: boolean) => {
      if (open) {
        setShowDownvoteThanks(false);
      }
      handleDownvotePanelToggle(open);
    },
    [handleDownvotePanelToggle]
  );

  const isDirectionVote = !!liveKeyFactor.base_rate;
  const downVoteType = isDirectionVote
    ? KeyFactorVoteTypes.DIRECTION
    : KeyFactorVoteTypes.STRENGTH;
  const downScore = isDirectionVote ? -5 : StrengthValues.NO_IMPACT;

  const handleDownvoteReasonSelect = useCallback(
    async (reason: DownvoteReason) => {
      if (!user || user.is_bot) return;

      setShowDownvoteThanks(true);
      const apiReason = DOWNVOTE_REASON_TO_API[reason];

      sendAnalyticsEvent("KeyFactorVote", {
        event_label: downScore.toString(),
        variant: "downvote_reason",
        reason: apiReason,
      });

      try {
        const resp = await voteKeyFactor({
          id: liveKeyFactor.id,
          vote: downScore,
          user: user.id,
          vote_type: downVoteType,
          vote_reason: apiReason,
        });
        if (resp) {
          const updated = resp as unknown as KeyFactorVoteAggregate;
          commentsFeed?.setKeyFactorVote(liveKeyFactor.id, updated);
        }
      } catch (e) {
        console.error("Failed to submit vote reason", e);
      }
    },
    [user, liveKeyFactor.id, downScore, downVoteType, commentsFeed]
  );

  return (
    <div ref={impactPanel.anchorRef} className="self-start">
      <KeyFactorCardContainer
        id={id}
        isFlagged={isFlagged}
        linkToComment={linkToComment}
        isCompact={isCompact}
        mode={mode}
        onClick={() => {
          closeAllPanels();
          onClick?.();
        }}
        className={className}
        impactDirection={impactDirection}
        impactStrength={impactStrength}
        disableHover={disableHover}
      >
        {liveKeyFactor.driver && (
          <KeyFactorDriver
            keyFactor={liveKeyFactor}
            mode={mode}
            isCompact={isCompact}
            truncateText={truncateText}
            impactVoteRef={impactVoteRef}
            onVotePanelToggle={handleUpvotePanelToggle}
            onDownvotePanelToggle={wrappedHandleDownvotePanelToggle}
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
            truncateText={truncateText}
            impactVoteRef={impactVoteRef}
            onVotePanelToggle={handleUpvotePanelToggle}
            onDownvotePanelToggle={wrappedHandleDownvotePanelToggle}
            onMorePanelToggle={handleMorePanelToggle}
            isMorePanelOpen={morePanel.showPanel}
          />
        )}
        {liveKeyFactor.news && (
          <KeyFactorNews
            keyFactor={liveKeyFactor}
            mode={mode}
            isCompact={isCompact}
            truncateText={truncateText}
            impactVoteRef={impactVoteRef}
            onVotePanelToggle={handleUpvotePanelToggle}
            onDownvotePanelToggle={wrappedHandleDownvotePanelToggle}
            onMorePanelToggle={handleMorePanelToggle}
            isMorePanelOpen={morePanel.showPanel}
            titleLinksToArticle={titleLinksToArticleProp ?? !linkToComment}
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
        onImpactSelect={(option) => impactVoteRef.current?.(option)}
        onDownvoteReasonSelect={handleDownvoteReasonSelect}
        showDownvoteThanks={showDownvoteThanks}
      />
    </div>
  );
};
