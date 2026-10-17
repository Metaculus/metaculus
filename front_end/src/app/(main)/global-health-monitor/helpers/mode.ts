// Full mode is the interactive dashboard; simple mode reads like the monthly report.
export const GHM_MODES = ["full", "simple"] as const;
export type GhmMode = (typeof GHM_MODES)[number];
export const DEFAULT_GHM_MODE: GhmMode = "full";

export function parseGhmMode(
  value: string | string[] | null | undefined
): GhmMode {
  const mode = Array.isArray(value) ? value[0] : value;
  return GHM_MODES.find((option) => option === mode) ?? DEFAULT_GHM_MODE;
}

// Query string for a page view. The latest edition and full mode are the defaults, so
// they stay out of URLs.
export function getGhmQuery({
  edition,
  mode,
}: {
  edition: string | null;
  mode: GhmMode;
}): string {
  const params = new URLSearchParams();
  if (edition) {
    params.set("edition", edition);
  }
  if (mode !== DEFAULT_GHM_MODE) {
    params.set("mode", mode);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
