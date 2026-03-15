"use client";

import { capitalize } from "lodash";
import { useTranslations } from "next-intl";
import { FC, RefObject } from "react";

import { KeyFactor } from "@/types/comment";
import { ProjectPermissions } from "@/types/post";

import MorePanel from "./more_panel";
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
  const downvotePanel = useVotePanel<DownvoteReason>();
  const morePanel = useVotePanel<string>();

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

  const handleUpvotePanelToggle = (open: boolean) =>
    toggleExclusive(impactPanel, [downvotePanel, morePanel], open);

  const handleDownvotePanelToggle = (open: boolean) =>
    toggleExclusive(downvotePanel, [impactPanel, morePanel], open);

  const handleMorePanelToggle = (open: boolean) =>
    toggleExclusive(morePanel, [impactPanel, downvotePanel], open);

  return {
    impactPanel,
    downvotePanel,
    morePanel,
    handleUpvotePanelToggle,
    handleDownvotePanelToggle,
    handleMorePanelToggle,
  };
}

type KeyFactorVotePanelsProps = {
  impactPanel: ReturnType<typeof useVotePanel<ImpactOption>>;
  downvotePanel: ReturnType<typeof useVotePanel<DownvoteReason>>;
  morePanel?: ReturnType<typeof useVotePanel<string>>;
  anchorRef: RefObject<HTMLDivElement | null>;
  isCompact?: boolean;
  keyFactor?: KeyFactor;
  projectPermission?: ProjectPermissions;
};

const KeyFactorVotePanels: FC<KeyFactorVotePanelsProps> = ({
  impactPanel,
  downvotePanel,
  morePanel,
  anchorRef,
  isCompact,
  keyFactor,
  projectPermission,
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
          anchorRef={anchorRef}
          onSelect={impactPanel.toggleOption}
          onClose={impactPanel.closePanel}
          renderLabel={(option) => capitalize(t(option))}
          buttonClassName={!isCompact ? "py-[11px]" : undefined}
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
          anchorRef={anchorRef}
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

      {morePanel?.showPanel && keyFactor && (
        <MorePanel
          ref={morePanel.panelRef}
          keyFactor={keyFactor}
          projectPermission={projectPermission}
          anchorRef={anchorRef}
          isCompact={isCompact}
          onClose={morePanel.closePanel}
        />
      )}
    </>
  );
};

export default KeyFactorVotePanels;
