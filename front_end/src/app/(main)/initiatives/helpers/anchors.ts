import type { MouseEvent } from "react";

import type { Initiative } from "../types";

export function getFeaturedAnchorId(initiative: Initiative): string | null {
  return initiative.placements.includes("featured") && initiative.feature
    ? `initiative-${initiative.id}`
    : null;
}

export function scrollToAnchor(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  target.scrollIntoView({
    block: "start",
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });

  const fragment = `#${id}`;
  if (window.location.hash !== fragment) {
    window.history.pushState(null, "", fragment);
  }

  return true;
}

export function shouldHandleAnchorClick(
  event: MouseEvent<HTMLElement>
): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
