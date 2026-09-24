import { Initiative } from "../types";

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
  return true;
}
