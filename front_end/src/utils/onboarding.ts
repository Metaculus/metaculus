"use client";

import { addDays, isAfter } from "date-fns";

import { OnboardingStoredState } from "@/types/onboarding";

const ONBOARDING_SUPPRESSED_KEY = "onboardingSuppressedAt";
const ONBOARDING_STATE_KEY = "onboardingState";

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

export function getOnboardingStoredState(): OnboardingStoredState {
  const storedValue =
    checkLocalStorageAvailable() && localStorage.getItem(ONBOARDING_STATE_KEY);
  return storedValue ? JSON.parse(storedValue) : {};
}

export function setOnboardingStoredState(data: OnboardingStoredState) {
  if (checkLocalStorageAvailable()) {
    localStorage.setItem(ONBOARDING_STATE_KEY, JSON.stringify(data));
  }
}

export function deleteOnboardingStoredState() {
  if (checkLocalStorageAvailable()) {
    localStorage.removeItem(ONBOARDING_STATE_KEY);
  }
}
