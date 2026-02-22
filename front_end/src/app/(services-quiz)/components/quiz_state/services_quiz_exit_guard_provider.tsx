"use client";

import { useRouter } from "next/navigation";
import React, {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
} from "react";

import { useExitGuard } from "@/components/flow/use_exit_guard";

import { useServicesQuizProgress } from "./services_quiz_progress_provider";

type ExitApi = {
  isExitModalOpen: boolean;
  requestExit: () => void;
  closeExitModal: () => void;
  exitNow: () => void;
};

const Ctx = createContext<ExitApi | null>(null);

export const useServicesQuizExitGuard = () => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useServicesQuizExitGuard must be used within provider");
  }
  return ctx;
};

export const ServicesQuizExitGuardProvider: FC<
  PropsWithChildren<{ exitTo?: string }>
> = ({ exitTo = "/services", children }) => {
  const router = useRouter();
  const { hasProgress } = useServicesQuizProgress();

  const exitNow = useCallback(() => {
    router.push(exitTo);
  }, [router, exitTo]);

  const { isExitModalOpen, requestExit, closeExitModal } = useExitGuard({
    canExitImmediately: !hasProgress,
    onExit: exitNow,
  });

  const value = useMemo(
    () => ({ isExitModalOpen, requestExit, closeExitModal, exitNow }),
    [isExitModalOpen, requestExit, closeExitModal, exitNow]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
