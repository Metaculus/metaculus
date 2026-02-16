"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/auth_context";
import { safeLocalStorage } from "@/utils/core/storage";

const STORAGE_PREFIX = "weeklyTopCommentsCtaDismissed:v1";

export function useTopCommentsCtaDismissed() {
  const { user } = useAuth();

  const key = useMemo(() => {
    return `${STORAGE_PREFIX}:${user?.id ?? "anon"}`;
  }, [user?.id]);

  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    setDismissed(safeLocalStorage.getItem(key) === "1");
    setReady(true);
  }, [key]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    safeLocalStorage.setItem(key, "1");
  }, [key]);

  return { dismissed, dismiss, ready };
}
