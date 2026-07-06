"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/auth_context";

const STORAGE_PREFIX = "tournamentsInfoDismissed:v1";

export function useTournamentsInfoDismissed() {
  const { user } = useAuth();

  const key = useMemo(() => {
    return `${STORAGE_PREFIX}:${user?.id ?? "anon"}`;
  }, [user?.id]);

  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(key) === "1");
    } catch {
    } finally {
      setReady(true);
    }
  }, [key]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(key, "1");
    } catch {}
  }, [key]);

  return { dismissed, dismiss, ready };
}
