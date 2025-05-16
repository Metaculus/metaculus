"use client";

import { addDays, isAfter } from "date-fns";

import { safeLocalStorage } from "@/utils/core/storage";

const ONBOARDING_SUPPRESSED_KEY = "onboardingSuppressedAt";
export const ONBOARDING_STATE_KEY = "onboardingStateV2";

export function checkOnboardingAllowed() {
  const closedAt = safeLocalStorage.getItem(ONBOARDING_SUPPRESSED_KEY);

  return closedAt ? isAfter(new Date(), addDays(new Date(closedAt), 1)) : true;
}

export function setOnboardingSuppressed() {
  safeLocalStorage.setItem(ONBOARDING_SUPPRESSED_KEY, new Date().toISOString());
}
