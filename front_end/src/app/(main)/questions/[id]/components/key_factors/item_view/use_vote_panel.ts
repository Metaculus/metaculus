import { useCallback, useEffect, useRef, useState } from "react";

export type ImpactOption = "low" | "medium" | "high";
export type DownvoteReason = "wrongDirection" | "noImpact" | "redundant";

export function useVotePanel<T extends string>() {
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
      if (panelRef.current && !panelRef.current.contains(target)) {
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
  }, [showPanel]);

  return {
    showPanel,
    selectedOption,
    anchorRef,
    panelRef,
    setShowPanel,
    closePanel,
    toggleOption,
  };
}
