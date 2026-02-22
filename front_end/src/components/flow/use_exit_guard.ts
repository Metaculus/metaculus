"use client";

import { useCallback, useState } from "react";

type Params = {
  canExitImmediately: boolean;
  onExit: () => void;
};

export function useExitGuard({ canExitImmediately, onExit }: Params) {
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const requestExit = useCallback(() => {
    if (canExitImmediately) {
      onExit();
      return;
    }
    setIsExitModalOpen(true);
  }, [canExitImmediately, onExit]);

  const closeExitModal = useCallback(() => setIsExitModalOpen(false), []);

  return {
    isExitModalOpen,
    requestExit,
    closeExitModal,
    openExitModal: () => setIsExitModalOpen(true),
  };
}
