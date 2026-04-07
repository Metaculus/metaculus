"use client";

import { capitalize } from "lodash";
import { useTranslations } from "next-intl";
import { FC, RefObject } from "react";

import { KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";

import MorePanel, { ActionItem, ActionPanel } from "./more_panel";
import { DownvoteReason, ImpactOption, useVotePanel } from "./use_vote_panel";
import VotePanel from "./vote_panel";

const IMPACT_OPTIONS: ImpactOption[] = ["low", "medium", "high"];
const DOWNVOTE_REASONS: DownvoteReason[] = [
  "wrongDirection",
  "noImpact",
  "redundant",
];

export function useKeyFactorVotePanels() {
  const impactPanel = useVotePanel<ImpactOption>();
  const downvotePanel = useVotePanel<DownvoteReason>(impactPanel.anchorRef);
  const morePanel = useVotePanel<string>(impactPanel.anchorRef);

  const toggleExclusive = (
    target: Pick<ReturnType<typeof useVotePanel>, "setShowPanel">,
    others: Pick<ReturnType<typeof useVotePanel>, "setShowPanel">[],
    open: boolean
  ) => {
    target.setShowPanel(open);
    if (open) {
      others.forEach((p) => p.setShowPanel(false));
    }
  };

  const handleUpvotePanelToggle = (open: boolean) => {
    toggleExclusive(impactPanel, [downvotePanel, morePanel], open);
    if (open) {
      impactPanel.setSelectedOption("medium" as ImpactOption);
    }
  };

  const handleDownvotePanelToggle = (open: boolean) =>
    toggleExclusive(downvotePanel, [impactPanel, morePanel], open);

  const handleMorePanelToggle = (open: boolean) =>
    toggleExclusive(morePanel, [impactPanel, downvotePanel], open);

  const closeAllPanels = () => {
    impactPanel.setShowPanel(false);
    downvotePanel.setShowPanel(false);
    morePanel.setShowPanel(false);
  };

  return {
    impactPanel,
    downvotePanel,
    morePanel,
    handleUpvotePanelToggle,
    handleDownvotePanelToggle,
    handleMorePanelToggle,
    closeAllPanels,
  };
}

type KeyFactorVotePanelsProps = {
  impactPanel: ReturnType<typeof useVotePanel<ImpactOption>>;
  downvotePanel: ReturnType<typeof useVotePanel<DownvoteReason>>;
  morePanel?: ReturnType<typeof useVotePanel<string>>;
  anchorRef: RefObject<HTMLDivElement | null>;
  isCompact?: boolean;
  inline?: boolean;
  keyFactor?: KeyFactor;
  projectPermission?: ProjectPermissions;
  onImpactSelect?: (option: ImpactOption) => void;
  onDownvoteReasonSelect?: (reason: DownvoteReason) => void;
  showDownvoteThanks?: boolean;
  moreActions?: ActionItem[];
  moreHeader?: React.ReactNode;
};

const KeyFactorVotePanels: FC<KeyFactorVotePanelsProps> = ({
  impactPanel,
  downvotePanel,
  morePanel,
  anchorRef,
  isCompact,
  inline,
  keyFactor,
  projectPermission,
  onImpactSelect,
  onDownvoteReasonSelect,
  showDownvoteThanks,
  moreActions,
  moreHeader,
}) => {
  const t = useTranslations();

  return (
    <>
      {impactPanel.showPanel && (
        <VotePanel
          ref={impactPanel.panelRef}
          options={IMPACT_OPTIONS}
          selectedOption={impactPanel.selectedOption}
          title={t("voteOnImpact")}
          isCompact={isCompact}
          inline={inline}
          anchorRef={anchorRef}
          onSelect={(option) => {
            impactPanel.toggleOption(option);
            onImpactSelect?.(option);
          }}
          onClose={impactPanel.closePanel}
          renderLabel={(option) => capitalize(t(option))}
          buttonClassName={!isCompact ? "sm:py-[11px]" : undefined}
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
          inline={inline}
          anchorRef={anchorRef}
          onSelect={(reason) => {
            downvotePanel.toggleOption(reason);
            onDownvoteReasonSelect?.(reason);
          }}
          onClose={downvotePanel.closePanel}
          renderLabel={(reason) => t(reason)}
          footer={
            showDownvoteThanks ? (
              <span className="text-xs font-medium leading-4 text-olive-800 dark:text-olive-800-dark">
                {t("thanksForVoting")}
              </span>
            ) : null
          }
        />
      )}

      {morePanel?.showPanel && keyFactor && (
        <MorePanel
          ref={morePanel.panelRef}
          keyFactor={keyFactor}
          projectPermission={projectPermission}
          anchorRef={anchorRef}
          isCompact={isCompact}
          inline={inline}
          onClose={morePanel.closePanel}
        />
      )}

      {morePanel?.showPanel && !keyFactor && moreActions && (
        <ActionPanel
          ref={morePanel.panelRef}
          actions={moreActions}
          header={moreHeader}
          anchorRef={anchorRef}
          isCompact={isCompact}
          inline={inline}
          onClose={morePanel.closePanel}
        />
      )}
    </>
  );
};

export default KeyFactorVotePanels;
