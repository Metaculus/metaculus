import { MilestoneGroup } from "./forecast";

export const STACK_BELOW_PX = 860;
export const STEM_BASE = { above: 44, below: 60 };
export const MOUSE_SCROLL_START_PX = 5;

const CARD_MAX_WIDTH = 262;
const CARD_GAP = 12;

export type Side = "above" | "below";

type GroupEntry = { group: MilestoneGroup; index: number };
type PlacedCard = GroupEntry & { left: number; width: number; offset: number };

export const percent = (fraction: number) => `${(fraction * 100).toFixed(2)}%`;

// Capabilities sit above the line and adoption below it.
export const placeZone = (
  groups: MilestoneGroup[],
  side: Side,
  trackWidth: number,
  step: number
): PlacedCard[] => {
  const entries = groups.flatMap((group, index): GroupEntry[] =>
    (group.kind === "cap" ? "above" : "below") === side
      ? [{ group, index }]
      : []
  );
  const count = entries.length;
  const width = Math.min(
    CARD_MAX_WIDTH,
    (trackWidth - CARD_GAP * (count - 1)) / count
  );
  const gap =
    count > 1
      ? Math.max(CARD_GAP, (trackWidth - count * width) / (count - 1))
      : 0;
  return entries.map((entry, i) => ({
    ...entry,
    left: i * (width + gap),
    width,
    offset: i * step,
  }));
};

// Orthogonal connector from the card to its dot on the line, with rounded
// corners at the horizontal jog.
export const stemPath = (
  width: number,
  height: number,
  dx: number,
  side: Side
) => {
  const x0 = width / 2;
  const x1 = x0 + dx;
  const from = side === "below" ? height : 0;
  const to = side === "below" ? 0 : height;
  const dir = side === "below" ? -1 : 1;
  const mid = height / 2;
  if (Math.abs(dx) < 1) return `M${x0} ${from} V${to}`;
  const r = Math.min(8, Math.abs(dx) / 2, height / 4);
  const sx = Math.sign(dx) || 1;
  return `M${x0} ${from} V${mid - dir * r} Q${x0} ${mid} ${x0 + sx * r} ${mid} H${x1 - sx * r} Q${x1} ${mid} ${x1} ${mid + dir * r} V${to}`;
};
