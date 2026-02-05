"use client";

import { isNil } from "lodash";
import { useFeatureFlagVariantKey } from "posthog-js/react";

import { useAuth } from "@/contexts/auth_context";

const FLAG_KEY = "logged_out_key_factors_variant";

export function useShouldHideKeyFactors(): boolean {
  const { user } = useAuth();
  const flagVariant = useFeatureFlagVariantKey(FLAG_KEY);

  // Only hide for logged-out users with "hidden" variant
  if (isNil(user) && flagVariant === "hidden") {
    return true;
  }

  return false;
}
