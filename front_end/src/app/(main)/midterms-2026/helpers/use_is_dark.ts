"use client";

import { useSyncExternalStore } from "react";

/**
 * Read the active dark-mode state synchronously from the
 * `<html class="dark">` marker that next-themes sets via its
 * pre-hydration `<script>`. The class is on the DOM before React
 * hydrates, but `useAppTheme()` (which reads next-themes' React
 * state via `useTheme()`) returns `"light"` for the first few
 * renders after hydration while next-themes catches up
 * internally. JS-driven inline color styling in this hub uses the
 * theme directly, so that lag manifests as bars painted with
 * light-mode hexes on a dark page until the user toggles the
 * theme, which forces a real state update.
 *
 * Bypassing next-themes for the visual-only `isDark` check —
 * reading the class directly via `useSyncExternalStore` +
 * `MutationObserver` — gives us the right answer from the very
 * first commit on the client, with no flash.
 *
 * For setTheme / theme-aware *actions* (writing back to the user
 * profile, the theme toggle UI, etc.) keep using `useAppTheme()`.
 */
const subscribe = (callback: () => void) => {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
};

const getSnapshot = () => document.documentElement.classList.contains("dark");

// Server render: assume light. useSyncExternalStore swaps to the
// real DOM value on the client without triggering a hydration
// warning (the hook is designed for this case).
const getServerSnapshot = () => false;

export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
