import { useCallback, useEffect, useRef, useState } from "react";

export type ImpactOption = "low" | "medium" | "high";

export function useVoteImpactPanel() {
  const [showVotePanel, setShowVotePanel] = useState(false);
  const [selectedImpact, setSelectedImpact] = useState<ImpactOption | null>(
    null
  );
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const closePanel = useCallback(() => {
    setShowVotePanel(false);
  }, []);

  const toggleImpact = useCallback((option: ImpactOption) => {
    setSelectedImpact((prev) => (prev === option ? null : option));
  }, []);

  useEffect(() => {
    if (!showVotePanel) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setShowVotePanel(false);
      }
    };

    const handleScroll = () => {
      setShowVotePanel(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [showVotePanel]);

  return {
    showVotePanel,
    selectedImpact,
    anchorRef,
    panelRef,
    setShowVotePanel,
    closePanel,
    toggleImpact,
  };
}
