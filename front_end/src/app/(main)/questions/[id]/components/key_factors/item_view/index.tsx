"use client";

import { capitalize } from "lodash";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { ImpactMetadata, KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import { getImpactDirectionFromMetadata } from "@/utils/key_factors";

import KeyFactorBaseRate from "./base_rate/key_factor_base_rate";
import KeyFactorDriver from "./driver/key_factor_driver";
import KeyFactorCardContainer from "./key_factor_card_container";
import KeyFactorNews from "./news/key_factor_news";
import { DownvoteReason, ImpactOption, useVotePanel } from "./use_vote_panel";
import VotePanel from "./vote_panel";

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

const IMPACT_OPTIONS: ImpactOption[] = ["low", "medium", "high"];
const DOWNVOTE_REASONS: DownvoteReason[] = [
  "wrongDirection",
  "noImpact",
  "redundant",
];

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
  const t = useTranslations();
  const isFlagged = keyFactor.flagged_by_me;
  const hasImpactBar = !keyFactor.base_rate;
  const impactDirection = hasImpactBar
    ? getImpactDirectionFromMetadata(getImpactMetadata(keyFactor))
    : undefined;
  const impactStrength = keyFactor.vote?.score ?? 0;

  const impactPanel = useVotePanel<ImpactOption>();
  const downvotePanel = useVotePanel<DownvoteReason>();

  const handleUpvotePanelToggle = (open: boolean) => {
    impactPanel.setShowPanel(open);
    if (open) downvotePanel.setShowPanel(false);
  };

  const handleDownvotePanelToggle = (open: boolean) => {
    downvotePanel.setShowPanel(open);
    if (open) impactPanel.setShowPanel(false);
  };

  return (
    <div ref={impactPanel.anchorRef}>
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
            onVotePanelToggle={handleUpvotePanelToggle}
            onDownvotePanelToggle={handleDownvotePanelToggle}
          />
        )}
        {keyFactor.base_rate && (
          <KeyFactorBaseRate
            keyFactor={keyFactor}
            isCompact={isCompact}
            mode={mode}
            projectPermission={projectPermission}
            isSuggested={isSuggested}
            onVotePanelToggle={handleUpvotePanelToggle}
            onDownvotePanelToggle={handleDownvotePanelToggle}
          />
        )}
        {keyFactor.news && (
          <KeyFactorNews
            keyFactor={keyFactor}
            mode={mode}
            isCompact={isCompact}
            projectPermission={projectPermission}
            onVotePanelToggle={handleUpvotePanelToggle}
            onDownvotePanelToggle={handleDownvotePanelToggle}
          />
        )}
      </KeyFactorCardContainer>

      {impactPanel.showPanel && (
        <VotePanel
          ref={impactPanel.panelRef}
          options={IMPACT_OPTIONS}
          selectedOption={impactPanel.selectedOption}
          title={t("voteOnImpact")}
          isCompact={isCompact}
          anchorRef={impactPanel.anchorRef}
          onSelect={impactPanel.toggleOption}
          onClose={impactPanel.closePanel}
          renderLabel={(option) => capitalize(t(option))}
        />
      )}

      {downvotePanel.showPanel && (
        <VotePanel
          ref={downvotePanel.panelRef}
          options={DOWNVOTE_REASONS}
          selectedOption={downvotePanel.selectedOption}
          title={t("why")}
          direction="column"
          isCompact={isCompact}
          anchorRef={impactPanel.anchorRef}
          onSelect={downvotePanel.toggleOption}
          onClose={downvotePanel.closePanel}
          renderLabel={(reason) => t(reason)}
          footer={
            downvotePanel.selectedOption ? (
              <span className="text-xs font-medium leading-4 text-olive-800 dark:text-olive-800-dark">
                {t("thanksForVoting")}
              </span>
            ) : null
          }
        />
      )}
    </div>
  );
};

export default dynamic(() => Promise.resolve(KeyFactorItem), {
  ssr: false,
});
