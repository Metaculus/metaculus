import { EDITION_2026_08_28 } from "./edition_2026_08_28";
import { EDITION_2026_09_17 } from "./edition_2026_09_17";
import { Edition } from "./types";

// Newest first.
export const EDITIONS: Edition[] = [EDITION_2026_09_17, EDITION_2026_08_28];

export const NEXT_EDITION_ON = "2026-10-15";

export function getLatestEdition(): Edition {
  const latest = EDITIONS[0];
  if (!latest) {
    throw new Error("Global Health Monitor has no editions");
  }
  return latest;
}

export function resolveEdition(slug: string | undefined): Edition {
  return (
    EDITIONS.find((edition) => edition.slug === slug) ?? getLatestEdition()
  );
}

export function getPreviousEdition(edition: Edition): Edition | null {
  const index = EDITIONS.findIndex((item) => item.slug === edition.slug);
  return index >= 0 ? EDITIONS[index + 1] ?? null : null;
}
