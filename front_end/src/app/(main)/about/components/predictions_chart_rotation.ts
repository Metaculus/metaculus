// Picks which event labels the chart shows at any moment. A few are visible
// at a time; on each swap one of the longest-shown fades out and a hidden
// one fades in. The newcomer must not overlap any label on screen (including
// the one leaving, since they cross-fade). Among those, events near the one
// leaving are preferred, so each region of the line keeps a label, but
// spread away from the other visible labels and away from ones that left
// recently, so the labels hop around rather than trading places.
//
// Hard rules: the event that just left never comes straight back, and the
// event that just arrived is never the next to leave.

export type Box = { x0: number; y0: number; x1: number; y1: number };
export type RotationSlot = {
  id: string;
  x: number;
  // Label, marker and leader extents; unknown until measured
  boxes?: Box[];
};

// Distance (chart units) over which the pull toward the leaving event
// halves roughly every 150 units
const PROXIMITY_SCALE = 220;
// Below this distance from another visible label a candidate is penalised
const COMFORT_GAP = 140;
const RECENT_PENALTY = 0.25;
// Minimum clearance between two labels' boxes
const BOX_PADDING = 6;

const boxesOverlap = (a: Box, b: Box) =>
  a.x0 < b.x1 + BOX_PADDING &&
  b.x0 < a.x1 + BOX_PADDING &&
  a.y0 < b.y1 + BOX_PADDING &&
  b.y0 < a.y1 + BOX_PADDING;

export const collides = (a: Box[] = [], b: Box[] = []) =>
  a.some((boxA) => b.some((boxB) => boxesOverlap(boxA, boxB)));

// Events flagged `initial`, else an evenly spaced subset by x, so the first
// paint covers the whole line
export function initialVisible(
  slots: (RotationSlot & { initial?: boolean })[],
  count: number
): string[] {
  const flagged = slots.filter((s) => s.initial).map((s) => s.id);
  if (flagged.length) return flagged.slice(0, count);
  const sorted = [...slots].sort((a, b) => a.x - b.x);
  if (sorted.length <= count) return sorted.map((s) => s.id);
  if (count <= 1) return sorted.slice(0, count).map((s) => s.id);
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const slot = sorted[Math.round((i * (sorted.length - 1)) / (count - 1))];
    if (slot) ids.push(slot.id);
  }
  return ids;
}

export function candidateWeight(
  candidate: RotationSlot,
  leaving: RotationSlot,
  staying: RotationSlot[],
  recent: string[]
): number {
  const proximity = Math.exp(
    -Math.abs(candidate.x - leaving.x) / PROXIMITY_SCALE
  );
  const nearest = staying.reduce(
    (min, s) => Math.min(min, Math.abs(s.x - candidate.x)),
    Infinity
  );
  const spacing = Math.max(0.1, Math.min(1, nearest / COMFORT_GAP)) ** 2;
  const freshness = recent.includes(candidate.id) ? RECENT_PENALTY : 1;
  return proximity * spacing * freshness;
}

// `visible` is in the order the labels appeared, so its last entry is the
// one that just arrived. `recent` lists the ids that left, newest first.
// `fixed` are always-on boxes (the founding label) that newcomers must clear.
//
// Normally one leaves and one enters. If nothing hidden fits, the oldest
// leaves alone, and the next call (one short of `count`) only adds.
export function nextSwap(
  slots: RotationSlot[],
  visible: string[],
  recent: string[],
  count: number,
  random: () => number = Math.random,
  fixed: Box[] = []
): { leaving?: string; entering?: string } | null {
  const byId = new Map(slots.map((s) => [s.id, s]));
  const onScreen = visible
    .map((id) => byId.get(id))
    .filter((s): s is RotationSlot => !!s);
  const candidates = slots.filter(
    (c) =>
      !visible.includes(c.id) &&
      c.id !== recent[0] &&
      !collides(c.boxes, fixed) &&
      !onScreen.some((s) => collides(c.boxes, s.boxes))
  );
  // Oldest first; the newest arrival stays for at least one more swap
  const leaving =
    onScreen.length >= count && onScreen.length > 1 ? onScreen[0] : undefined;

  if (!candidates.length) return leaving ? { leaving: leaving.id } : null;

  const anchor = leaving ?? onScreen[onScreen.length - 1];
  const staying = onScreen.filter((s) => s !== leaving);
  const weights = candidates.map((c) =>
    anchor ? candidateWeight(c, anchor, staying, recent) : 1
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let r = random() * total;
  let entering = candidates[candidates.length - 1];
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) {
      entering = candidates[i];
      break;
    }
  }
  return { leaving: leaving?.id, entering: entering?.id };
}
