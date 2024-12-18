"use client";

import { addDays, isAfter } from "date-fns";

const ONBOARDING_SUPPRESSED_KEY = "onboardingSuppressedAt";
export const ONBOARDING_STATE_KEY = "onboardingStateV2";

export function checkLocalStorageAvailable() {
  return typeof window !== "undefined" && window.localStorage;
}

export function checkOnboardingAllowed() {
  const closedAt =
    checkLocalStorageAvailable() &&
    localStorage.getItem(ONBOARDING_SUPPRESSED_KEY);

  return closedAt ? isAfter(new Date(), addDays(new Date(closedAt), 1)) : true;
}

export function setOnboardingSuppressed() {
  if (checkLocalStorageAvailable()) {
    localStorage.setItem(ONBOARDING_SUPPRESSED_KEY, new Date().toISOString());
  }
}
