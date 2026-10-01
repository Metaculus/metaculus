import {
  type Point,
  type Rect,
  type SafeBounds,
  isWithinBounds,
  overlapArea,
  rectsOverlap,
  segmentEntryIntoRect,
  segmentIntersectsRect,
  segmentsIntersect,
} from "./helpers";

export type LabelAnchor = "start" | "middle" | "end";

export type LabelLayoutPoint = {
  x: number;
  y: number;
  name: string;
  isObstacle: boolean;
  wantsLabel: boolean;
};

export type PlacedLabel = {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  anchor: LabelAnchor;
  name: string;
  rect: Rect;
  leaderEnd: Point;
};

export type LineObstacle = [Point, Point];

export type LabelLayoutOptions = {
  safeBounds: SafeBounds;
  fontSize: number;
  measureText: (text: string, fontSize: number) => number;
  rectPadding: number;
  dotRadius: number;
  // Fixed boxes labels must not overlap, beyond the points themselves.
  extraObstacles?: Rect[];
  // Drawn lines a label box should stay off when it can.
  lineObstacles?: LineObstacle[];
};

// Remembers where each label was last drawn so that adding or removing a
// label (hovering a point) leaves every other label where it is.
export type LabelLayoutMemory = { rects: Map<string, Rect> };

export function createLabelLayoutMemory(): LabelLayoutMemory {
  return { rects: new Map() };
}

type Candidate = {
  dx: number;
  dy: number;
  anchor: LabelAnchor;
  cost: number;
};

// A candidate's cost is its distance from the point scaled by a per-direction
// weight: upward diagonals are cheapest (the chart's empty space sits above the
// frontier), purely horizontal offsets are most expensive because a level
// leader line reads as belonging to a neighbouring point.
const CANDIDATE_RADII = [
  8, 14, 22, 32, 44, 58, 74, 92, 112, 134, 158, 184, 212, 242,
];
const CANDIDATE_ANGLE_WEIGHTS: Array<[number, number]> = [
  [-30, 1.0],
  [-150, 1.0],
  [-45, 1.0],
  [-135, 1.0],
  [-60, 1.05],
  [-120, 1.05],
  [-75, 1.1],
  [-105, 1.1],
  [-90, 1.1],
  [-15, 1.3],
  [-165, 1.3],
  [30, 1.2],
  [150, 1.2],
  [45, 1.25],
  [135, 1.25],
  [60, 1.3],
  [120, 1.3],
  [75, 1.35],
  [105, 1.35],
  [90, 1.35],
  [15, 1.5],
  [165, 1.5],
  [0, 1.8],
  [180, 1.8],
];
const MIDDLE_ANCHOR_COS_THRESHOLD = 0.35;
// Pairwise terms can only be non-zero between placements whose reach boxes
// (label box plus its point, padded) touch; the margin covers overlap padding.
const REACH_MARGIN = 4;

// Overlapping boxes, and a leader line running through another label's box,
// are never acceptable; everything else is a preference.
const COLLISION_COST = 1_000_000;
const LEADER_THROUGH_OBSTACLE_COST = 400;
const LINE_OVERLAP_COST = 250;
const LEADER_CROSSING_COST = 40;
const SHADOW_COST = 150;
// Labels scoring at least this much (a far slot, a line overlap, or worse)
// are worth spending polish iterations on.
const POLISH_TRIGGER_SCORE = 200;

// Search effort. Candidates are evaluated cheapest-first; the scan stops once
// no cheaper candidate can beat the best clean slot, or after this many
// candidates when the best so far is clean but penalised. A colliding best is
// only accepted early in the cheap mode used for very large label sets.
const MAX_FALLBACK_CANDIDATES = 96;
const CHEAP_MODE_SCAN_LIMIT = 96;
const MAX_REFINEMENT_SWEEPS = 12;
const FULL_SEARCH_MAX_LABELS = 40;
const POLISH_ITERATIONS = 4000;
const POLISH_STALL_ITERATIONS = 700;
const POLISH_START_TEMPERATURE = 80;
const POLISH_END_TEMPERATURE = 3;
const POLISH_NEAR_CANDIDATE_COUNT = 72;
const POLISH_EJECTION_PROBABILITY = 0.7;
const POLISH_EJECTION_CANDIDATE_LIMIT = 150;
const POLISH_EJECTION_MAX_BLOCKERS = 2;
const POLISH_EJECTION_CHOICES = 6;
const POLISH_SEED = 0x9e3779b9;

function buildCandidates(): Candidate[] {
  const candidates: Candidate[] = [];
  for (const radius of CANDIDATE_RADII) {
    for (const [angleDeg, weight] of CANDIDATE_ANGLE_WEIGHTS) {
      const angle = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(angle);
      const anchor: LabelAnchor =
        Math.abs(cos) < MIDDLE_ANCHOR_COS_THRESHOLD
          ? "middle"
          : cos > 0
            ? "start"
            : "end";
      candidates.push({
        dx: radius * cos,
        dy: radius * Math.sin(angle),
        anchor,
        cost: radius * weight,
      });
    }
  }
  return candidates.sort((a, b) => a.cost - b.cost);
}

const CANDIDATES = buildCandidates();

const ORDERINGS: Array<(a: LabelLayoutPoint, b: LabelLayoutPoint) => number> = [
  (a, b) => a.y - b.y || a.x - b.x,
  (a, b) => b.y - a.y || b.x - a.x,
  (a, b) => a.x - b.x || a.y - b.y,
  (a, b) => b.x - a.x || b.y - a.y,
];

// staticScore is the part of a placement's score that comes from fixed
// geometry (dots, extra obstacle boxes, drawn lines); it is computed once.
type Placement = {
  rect: Rect;
  labelX: number;
  labelY: number;
  anchor: LabelAnchor;
  leaderEnd: Point;
  cost: number;
  staticScore: number;
  overlapsObstacle: boolean;
  reach: Rect;
};

type LayoutLabel = {
  point: LabelLayoutPoint;
  candidates: Placement[];
  placement: Placement;
};

type FixedGeometry = { obstacles: Rect[]; lines: LineObstacle[] };

function rectLeftForAnchor(
  labelX: number,
  anchor: LabelAnchor,
  textWidth: number
): number {
  if (anchor === "end") return labelX - textWidth;
  if (anchor === "middle") return labelX - textWidth / 2;
  return labelX;
}

function labelXForRectLeft(
  rectLeft: number,
  anchor: LabelAnchor,
  textWidth: number
): number {
  if (anchor === "end") return rectLeft + textWidth;
  if (anchor === "middle") return rectLeft + textWidth / 2;
  return rectLeft;
}

function clampPaddedRect(rect: Rect, safeBounds: SafeBounds): Rect {
  let { x, y } = rect;
  if (x < safeBounds.left) x = safeBounds.left;
  if (x + rect.width > safeBounds.right) x = safeBounds.right - rect.width;
  if (y < safeBounds.top) y = safeBounds.top;
  if (y + rect.height > safeBounds.bottom) {
    y = safeBounds.bottom - rect.height;
  }
  return { x, y, width: rect.width, height: rect.height };
}

function boundingBox(rect: Rect, point: Point, margin: number): Rect {
  const left = Math.min(rect.x, point.x) - margin;
  const top = Math.min(rect.y, point.y) - margin;
  const right = Math.max(rect.x + rect.width, point.x) + margin;
  const bottom = Math.max(rect.y + rect.height, point.y) + margin;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function rectsTouch(a: Rect, b: Rect): boolean {
  return rectsOverlap(a, b, 0);
}

function sameRect(a: Rect, b: Rect): boolean {
  const tolerance = 0.01;
  return (
    Math.abs(a.x - b.x) < tolerance &&
    Math.abs(a.y - b.y) < tolerance &&
    Math.abs(a.width - b.width) < tolerance &&
    Math.abs(a.height - b.height) < tolerance
  );
}

function staticScoreFor(
  point: LabelLayoutPoint,
  rect: Rect,
  leaderEnd: Point,
  ownDot: Rect | null,
  fixed: FixedGeometry
): { staticScore: number; overlapsObstacle: boolean } {
  const reach = boundingBox(rect, point, REACH_MARGIN);
  let overlapCount = 0;
  let overlapPenalty = 0;
  let leaderThroughObstacles = 0;
  for (const obstacle of fixed.obstacles) {
    if (!rectsTouch(reach, obstacle)) continue;
    if (rectsOverlap(rect, obstacle)) {
      overlapCount += 1;
      overlapPenalty += overlapArea(rect, obstacle);
    }
    if (
      obstacle !== ownDot &&
      segmentIntersectsRect(point, leaderEnd, obstacle)
    ) {
      leaderThroughObstacles += 1;
    }
  }
  const lineOverlaps = fixed.lines.filter(([start, end]) =>
    segmentIntersectsRect(start, end, rect)
  ).length;
  return {
    staticScore:
      overlapCount * COLLISION_COST +
      overlapPenalty +
      leaderThroughObstacles * LEADER_THROUGH_OBSTACLE_COST +
      lineOverlaps * LINE_OVERLAP_COST,
    overlapsObstacle: overlapCount > 0,
  };
}

function candidatePlacements(
  point: LabelLayoutPoint,
  ownDot: Rect | null,
  fixed: FixedGeometry,
  options: LabelLayoutOptions
): Placement[] {
  const { safeBounds, fontSize, measureText, rectPadding } = options;
  const textWidth = measureText(point.name, fontSize);
  const textHeight = fontSize + 2;
  const placements: Placement[] = [];

  for (const candidate of CANDIDATES) {
    const rawRectLeft = rectLeftForAnchor(
      point.x + candidate.dx,
      candidate.anchor,
      textWidth
    );
    const rect = clampPaddedRect(
      {
        x: rawRectLeft - rectPadding,
        y: point.y + candidate.dy - textHeight / 2 - rectPadding,
        width: textWidth + 2 * rectPadding,
        height: textHeight + 2 * rectPadding,
      },
      safeBounds
    );
    if (!isWithinBounds(rect, safeBounds)) continue;

    const labelX = labelXForRectLeft(
      rect.x + rectPadding,
      candidate.anchor,
      textWidth
    );
    const labelY = rect.y + rectPadding + textHeight / 2;
    const rectCenter = { x: rect.x + rect.width / 2, y: labelY };
    const leaderEnd = segmentEntryIntoRect(point, rectCenter, rect);
    placements.push({
      rect,
      labelX,
      labelY,
      anchor: candidate.anchor,
      leaderEnd,
      cost: candidate.cost,
      reach: boundingBox(rect, point, REACH_MARGIN),
      ...staticScoreFor(point, rect, leaderEnd, ownDot, fixed),
    });
  }
  return placements;
}

function dotRect(point: LabelLayoutPoint, dotRadius: number): Rect {
  return {
    x: point.x - dotRadius,
    y: point.y - dotRadius,
    width: dotRadius * 2,
    height: dotRadius * 2,
  };
}

// Number of still-unplaced labelled points sitting directly beneath the rect.
// A label parked there would wall those points off from the open space above.
function countShadowedPoints(rect: Rect, pending: LabelLayoutPoint[]): number {
  return pending.filter(
    (point) =>
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y > rect.y + rect.height
  ).length;
}

// Score one placement against the other labels, on top of its static score.
// Every pairwise term is symmetric, so the sum of per-label scores is a
// consistent energy for the whole layout.
function scorePlacement(
  label: LayoutLabel,
  placement: Placement,
  others: LayoutLabel[],
  pending: LabelLayoutPoint[]
): number {
  const { point } = label;
  const { rect, leaderEnd, reach } = placement;

  let overlapCount = 0;
  let overlapPenalty = 0;
  let leaderThroughBoxes = 0;
  let leaderCrossings = 0;

  for (const other of others) {
    if (!rectsTouch(reach, other.placement.reach)) continue;
    const otherRect = other.placement.rect;
    if (rectsOverlap(rect, otherRect)) {
      overlapCount += 1;
      overlapPenalty += overlapArea(rect, otherRect);
    }
    if (segmentIntersectsRect(point, leaderEnd, otherRect)) {
      leaderThroughBoxes += 1;
    }
    if (segmentIntersectsRect(other.point, other.placement.leaderEnd, rect)) {
      leaderThroughBoxes += 1;
    }
    if (
      segmentsIntersect(
        point,
        leaderEnd,
        other.point,
        other.placement.leaderEnd
      )
    ) {
      leaderCrossings += 1;
    }
  }

  return (
    placement.staticScore +
    overlapCount * COLLISION_COST +
    overlapPenalty +
    placement.cost +
    leaderThroughBoxes * COLLISION_COST +
    leaderCrossings * LEADER_CROSSING_COST +
    countShadowedPoints(rect, pending) * SHADOW_COST
  );
}

function bestPlacement(
  label: LayoutLabel,
  others: LayoutLabel[],
  pending: LabelLayoutPoint[],
  scanLimit = Number.POSITIVE_INFINITY
): { placement: Placement; score: number } | null {
  let best: { placement: Placement; score: number } | null = null;
  for (const [index, placement] of label.candidates.entries()) {
    if (best && index >= scanLimit) break;
    if (best && best.score < COLLISION_COST) {
      if (placement.cost >= best.score) break;
      if (index >= MAX_FALLBACK_CANDIDATES) break;
    }
    const score = scorePlacement(label, placement, others, pending);
    if (!best || score < best.score) best = { placement, score };
  }
  return best;
}

function greedyLayout(
  orderedLabels: LayoutLabel[],
  fixedLabels: LayoutLabel[] = [],
  scanLimit = Number.POSITIVE_INFINITY
): LayoutLabel[] {
  const placed: LayoutLabel[] = [...fixedLabels];
  for (const [index, label] of orderedLabels.entries()) {
    const pending = orderedLabels
      .slice(index + 1)
      .map((pendingLabel) => pendingLabel.point);
    const best = bestPlacement(label, placed, pending, scanLimit);
    if (!best) continue;
    label.placement = best.placement;
    placed.push(label);
  }
  return placed;
}

function othersOf(labels: LayoutLabel[], index: number): LayoutLabel[] {
  return labels.filter((_, otherIndex) => otherIndex !== index);
}

// Re-place each label given all the others until nothing improves, so a label
// that boxed in a neighbour during the greedy pass can move out of the way.
function refineLayout(
  labels: LayoutLabel[],
  scanLimit = Number.POSITIVE_INFINITY
): void {
  for (let sweep = 0; sweep < MAX_REFINEMENT_SWEEPS; sweep++) {
    let changed = false;
    for (const [index, label] of labels.entries()) {
      const others = othersOf(labels, index);
      const currentScore = scorePlacement(label, label.placement, others, []);
      const best = bestPlacement(label, others, [], scanLimit);
      if (best && best.score < currentScore) {
        label.placement = best.placement;
        changed = true;
      }
    }
    if (!changed) break;
  }
}

function labelScores(labels: LayoutLabel[]): number[] {
  return labels.map((label, index) =>
    scorePlacement(label, label.placement, othersOf(labels, index), [])
  );
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

// Deterministic PRNG so the same data always yields the same layout.
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pairwiseConflict(
  label: LayoutLabel,
  placement: Placement,
  other: LayoutLabel
): boolean {
  const otherPlacement = other.placement;
  if (!rectsTouch(placement.reach, otherPlacement.reach)) return false;
  return (
    rectsOverlap(placement.rect, otherPlacement.rect) ||
    segmentIntersectsRect(
      label.point,
      placement.leaderEnd,
      otherPlacement.rect
    ) ||
    segmentIntersectsRect(other.point, otherPlacement.leaderEnd, placement.rect)
  );
}

// Slots for a label that are free of fixed obstacles and blocked by only one
// or two other labels, cheapest first, each paired with its blockers.
function ejectionProposals(
  labels: LayoutLabel[],
  index: number
): Array<{ candidate: Placement; blockers: LayoutLabel[] }> {
  const label = labels[index];
  if (!label) return [];
  const others = othersOf(labels, index);
  const proposals: Array<{ candidate: Placement; blockers: LayoutLabel[] }> =
    [];
  const candidates = label.candidates.slice(0, POLISH_EJECTION_CANDIDATE_LIMIT);
  for (const candidate of candidates) {
    if (proposals.length >= POLISH_EJECTION_CHOICES) break;
    if (candidate === label.placement) continue;
    if (candidate.overlapsObstacle) continue;
    const blockers = others.filter((other) =>
      pairwiseConflict(label, candidate, other)
    );
    if (
      blockers.length >= 1 &&
      blockers.length <= POLISH_EJECTION_MAX_BLOCKERS
    ) {
      proposals.push({ candidate, blockers });
    }
  }
  return proposals;
}

// Labels whose score can change when the given labels move: pairwise terms
// are only ever non-zero between labels whose reaches touch.
function affectedIndices(
  labels: LayoutLabel[],
  movedIndices: number[],
  previousPlacements: Map<number, Placement>
): number[] {
  const regions: Rect[] = [];
  for (const index of movedIndices) {
    const label = labels[index];
    const previous = previousPlacements.get(index);
    if (!label || !previous) continue;
    regions.push(previous.reach, label.placement.reach);
  }
  const affected = new Set(movedIndices);
  labels.forEach((label, index) => {
    if (affected.has(index)) return;
    const reach = label.placement.reach;
    if (regions.some((region) => rectsTouch(region, reach))) {
      affected.add(index);
    }
  });
  return [...affected];
}

// Simulated-annealing polish for layouts the greedy passes leave poor. Labels
// scoring at least `triggerScore` are the targets. Besides random single moves
// it proposes ejections: an unhappy label takes a slot its neighbours block,
// and those neighbours are re-placed at once, so a small group of labels can
// rearrange in a single step.
function polishLayout(labels: LayoutLabel[], triggerScore: number): void {
  if (labels.length < 2) return;
  const random = mulberry32(POLISH_SEED);
  const scores = labelScores(labels);
  let total = sum(scores);
  let best = { total, placements: labels.map((label) => label.placement) };
  const temperatureRatio = POLISH_END_TEMPERATURE / POLISH_START_TEMPERATURE;
  const isUnhappy = (index: number) => (scores[index] ?? 0) >= triggerScore;

  let lastImprovement = 0;

  for (let iteration = 0; iteration < POLISH_ITERATIONS; iteration++) {
    if (iteration - lastImprovement > POLISH_STALL_ITERATIONS) break;
    const temperature =
      POLISH_START_TEMPERATURE *
      temperatureRatio ** (iteration / POLISH_ITERATIONS);
    const unhappy = labels.map((_, index) => index).filter(isUnhappy);
    if (unhappy.length === 0) break;

    const index =
      random() < 0.5
        ? unhappy[Math.floor(random() * unhappy.length)] ?? 0
        : Math.floor(random() * labels.length);
    const label = labels[index];
    if (!label) continue;

    const proposals =
      isUnhappy(index) && random() < POLISH_EJECTION_PROBABILITY
        ? ejectionProposals(labels, index)
        : [];
    const ejection = proposals[Math.floor(random() * proposals.length)];
    const previous = new Map<number, Placement>([[index, label.placement]]);

    if (ejection) {
      label.placement = ejection.candidate;
      for (const blocker of ejection.blockers) {
        const blockerIndex = labels.indexOf(blocker);
        previous.set(blockerIndex, blocker.placement);
        const replaced = bestPlacement(
          blocker,
          othersOf(labels, blockerIndex),
          []
        );
        if (replaced) blocker.placement = replaced.placement;
      }
    } else {
      const nearCount = Math.min(
        POLISH_NEAR_CANDIDATE_COUNT,
        label.candidates.length
      );
      const candidateIndex =
        random() < 0.4
          ? Math.floor(random() * nearCount)
          : Math.floor(random() * label.candidates.length);
      const candidate = label.candidates[candidateIndex];
      if (!candidate || candidate === label.placement) continue;
      label.placement = candidate;
    }

    const affected = affectedIndices(labels, [...previous.keys()], previous);
    const updated = new Map<number, number>();
    let delta = 0;
    for (const affectedIndex of affected) {
      const affectedLabel = labels[affectedIndex];
      if (!affectedLabel) continue;
      const score = scorePlacement(
        affectedLabel,
        affectedLabel.placement,
        othersOf(labels, affectedIndex),
        []
      );
      updated.set(affectedIndex, score);
      delta += score - (scores[affectedIndex] ?? 0);
    }

    if (delta > 0 && random() >= Math.exp(-delta / temperature)) {
      for (const [movedIndex, placement] of previous) {
        const moved = labels[movedIndex];
        if (moved) moved.placement = placement;
      }
      continue;
    }
    for (const [updatedIndex, score] of updated) scores[updatedIndex] = score;
    total += delta;
    if (total < best.total) {
      best = { total, placements: labels.map((current) => current.placement) };
      lastImprovement = iteration;
    }
  }

  labels.forEach((label, index) => {
    const placement = best.placements[index];
    if (placement) label.placement = placement;
  });
}

function runLayout(
  orderedLabels: LayoutLabel[],
  fullSearch: boolean
): { labels: LayoutLabel[]; total: number } {
  const scanLimit = fullSearch
    ? Number.POSITIVE_INFINITY
    : CHEAP_MODE_SCAN_LIMIT;
  const labels = greedyLayout(orderedLabels, [], scanLimit);
  refineLayout(labels, scanLimit);
  return { labels, total: sum(labelScores(labels)) };
}

// Greedy placement across several orderings, refinement sweeps, and an
// annealing polish when any label is left badly placed. Overlapping boxes are
// never accepted while a non-overlapping slot exists; if none does, the
// least-overlapping slot is used so no label vanishes.
function layoutFromScratch(labels: LayoutLabel[]): LayoutLabel[] {
  // Large label sets (the "show all labels" mode) cannot be made conflict-free
  // anyway, so they get a single cheap pass instead of the full search.
  const fullSearch = labels.length <= FULL_SEARCH_MAX_LABELS;
  const orderings = fullSearch ? ORDERINGS : ORDERINGS.slice(0, 1);
  const isPoor = (score: number) => score >= POLISH_TRIGGER_SCORE;
  let best: { labels: LayoutLabel[]; total: number } | null = null;

  for (const ordering of orderings) {
    const ordered = labels
      .map((label) => ({ ...label }))
      .sort((a, b) => ordering(a.point, b.point));
    const result = runLayout(ordered, fullSearch);
    if (!best || result.total < best.total) best = result;
    if (!labelScores(best.labels).some(isPoor)) break;
  }

  if (best && fullSearch && labelScores(best.labels).some(isPoor)) {
    polishLayout(best.labels, POLISH_TRIGGER_SCORE);
    refineLayout(best.labels);
  }
  return best?.labels ?? [];
}

// Labels that were drawn before stay exactly where they were and only the new
// labels are placed, so a hovered label never makes the others jump. A new
// label that finds no clean slot takes its least-bad one.
function layoutIncrementally(
  pinned: LayoutLabel[],
  fresh: LayoutLabel[]
): LayoutLabel[] {
  const ordering = ORDERINGS[0];
  const ordered = ordering
    ? [...fresh].sort((a, b) => ordering(a.point, b.point))
    : fresh;
  return greedyLayout(ordered, pinned);
}

function memoryKey(point: LabelLayoutPoint): string {
  return `${point.name}@${point.x.toFixed(2)},${point.y.toFixed(2)}`;
}

export function computeLabelLayout(
  points: LabelLayoutPoint[],
  options: LabelLayoutOptions,
  memory?: LabelLayoutMemory
): PlacedLabel[] {
  const dotByPoint = new Map<LabelLayoutPoint, Rect>();
  for (const point of points) {
    if (point.isObstacle)
      dotByPoint.set(point, dotRect(point, options.dotRadius));
  }
  const fixed: FixedGeometry = {
    obstacles: [...dotByPoint.values(), ...(options.extraObstacles ?? [])],
    lines: options.lineObstacles ?? [],
  };

  const pinned: LayoutLabel[] = [];
  const fresh: LayoutLabel[] = [];
  for (const point of points) {
    if (!point.wantsLabel) continue;
    const ownDot = dotByPoint.get(point) ?? null;
    const candidates = candidatePlacements(point, ownDot, fixed, options);
    const first = candidates[0];
    if (!first) continue;
    const remembered = memory?.rects.get(memoryKey(point));
    const rememberedPlacement = remembered
      ? candidates.find((candidate) => sameRect(candidate.rect, remembered))
      : undefined;
    if (rememberedPlacement) {
      pinned.push({ point, candidates, placement: rememberedPlacement });
    } else {
      fresh.push({ point, candidates, placement: first });
    }
  }

  const labels =
    pinned.length === 0
      ? layoutFromScratch(fresh)
      : layoutIncrementally(pinned, fresh);

  if (memory) {
    for (const label of labels) {
      memory.rects.set(memoryKey(label.point), label.placement.rect);
    }
  }

  return labels.map(({ point, placement }) => ({
    x: point.x,
    y: point.y,
    labelX: placement.labelX,
    labelY: placement.labelY,
    anchor: placement.anchor,
    name: point.name,
    rect: placement.rect,
    leaderEnd: placement.leaderEnd,
  }));
}
