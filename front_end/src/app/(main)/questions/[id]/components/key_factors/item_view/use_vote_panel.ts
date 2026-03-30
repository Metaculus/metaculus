import { RefObject, useCallback, useEffect, useRef, useState } from "react";

import { KeyFactorVoteReason } from "@/types/comment";

export type ImpactOption = "low" | "medium" | "high";
export type DownvoteReason = "wrongDirection" | "noImpact" | "redundant";

export const DOWNVOTE_REASON_TO_API: Record<
  DownvoteReason,
  KeyFactorVoteReason
> = {
  wrongDirection: "wrong_direction",
  noImpact: "no_impact",
  redundant: "redundant",
};

export const API_TO_DOWNVOTE_REASON: Record<
  KeyFactorVoteReason,
  DownvoteReason
> = {
  wrong_direction: "wrongDirection",
  no_impact: "noImpact",
  redundant: "redundant",
};

export function useVotePanel<T extends string>(
  excludeRef?: RefObject<HTMLDivElement | null>
) {
  const [showPanel, setShowPanel] = useState(false);
  const [selectedOption, setSelectedOption] = useState<T | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const closePanel = useCallback(() => {
    setShowPanel(false);
  }, []);

  const toggleOption = useCallback((option: T) => {
    setSelectedOption((prev) => (prev === option ? null : option));
  }, []);

  useEffect(() => {
    if (!showPanel) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        (!anchorRef.current || !anchorRef.current.contains(target)) &&
        (!excludeRef?.current || !excludeRef.current.contains(target))
      ) {
        setShowPanel(false);
      }
    };

    const handleScroll = () => {
      setShowPanel(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [showPanel, excludeRef]);

  return {
    showPanel,
    selectedOption,
    anchorRef,
    panelRef,
    setShowPanel,
    setSelectedOption,
    closePanel,
    toggleOption,
  };
}
