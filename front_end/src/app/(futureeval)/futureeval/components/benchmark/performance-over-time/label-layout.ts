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

export type LabelLayoutOptions = {
  safeBounds: SafeBounds;
  fontSize: number;
  measureText: (text: string, fontSize: number) => number;
  rectPadding: number;
  dotRadius: number;
};

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

// Overlapping boxes are never acceptable; everything else is a preference.
const COLLISION_COST = 1_000_000;
const LEADER_THROUGH_OBSTACLE_COST = 400;
const LEADER_CROSSING_COST = 40;
const SHADOW_COST = 150;

// Search effort. Candidates are evaluated cheapest-first and the scan stops
// early once a clean slot is found; the fallback cap bounds work when none is.
const MAX_FALLBACK_CANDIDATES = 96;
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

// dotScore is the static part of a placement's score: overlaps with dots and
// the leader passing over dots. Dots never move, so it is computed once.
type Placement = {
  rect: Rect;
  labelX: number;
  labelY: number;
  anchor: LabelAnchor;
  leaderEnd: Point;
  cost: number;
  dotScore: number;
  overlapsDot: boolean;
  reach: Rect;
};

type LayoutLabel = {
  point: LabelLayoutPoint;
  candidates: Placement[];
  placement: Placement;
};

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

function dotScoreFor(
  point: LabelLayoutPoint,
  rect: Rect,
  leaderEnd: Point,
  ownDot: Rect | null,
  dots: Rect[]
): { dotScore: number; overlapsDot: boolean } {
  const reach = boundingBox(rect, point, REACH_MARGIN);
  let overlapCount = 0;
  let overlapPenalty = 0;
  let leaderThroughDots = 0;
  for (const dot of dots) {
    if (!rectsTouch(reach, dot)) continue;
    if (rectsOverlap(rect, dot)) {
      overlapCount += 1;
      overlapPenalty += overlapArea(rect, dot);
    }
    if (dot !== ownDot && segmentIntersectsRect(point, leaderEnd, dot)) {
      leaderThroughDots += 1;
    }
  }
  return {
    dotScore:
      overlapCount * COLLISION_COST +
      overlapPenalty +
      leaderThroughDots * LEADER_THROUGH_OBSTACLE_COST,
    overlapsDot: overlapCount > 0,
  };
}

function candidatePlacements(
  point: LabelLayoutPoint,
  ownDot: Rect | null,
  dots: Rect[],
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
      ...dotScoreFor(point, rect, leaderEnd, ownDot, dots),
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

// Score one placement against the other labels, on top of its static dot
// score. Every pairwise term is symmetric, so the sum of per-label scores is a
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
    placement.dotScore +
    overlapCount * COLLISION_COST +
    overlapPenalty +
    placement.cost +
    leaderThroughBoxes * LEADER_THROUGH_OBSTACLE_COST +
    leaderCrossings * LEADER_CROSSING_COST +
    countShadowedPoints(rect, pending) * SHADOW_COST
  );
}

function bestPlacement(
  label: LayoutLabel,
  others: LayoutLabel[],
  pending: LabelLayoutPoint[]
): { placement: Placement; score: number } | null {
  let best: { placement: Placement; score: number } | null = null;
  for (const [index, placement] of label.candidates.entries()) {
    if (best && best.score < COLLISION_COST && placement.cost >= best.score) {
      break;
    }
    if (best && index >= MAX_FALLBACK_CANDIDATES) break;
    const score = scorePlacement(label, placement, others, pending);
    if (!best || score < best.score) best = { placement, score };
  }
  return best;
}

function greedyLayout(orderedLabels: LayoutLabel[]): LayoutLabel[] {
  const placed: LayoutLabel[] = [];
  for (const [index, label] of orderedLabels.entries()) {
    const pending = orderedLabels
      .slice(index + 1)
      .map((pendingLabel) => pendingLabel.point);
    const best = bestPlacement(label, placed, pending);
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
function refineLayout(labels: LayoutLabel[]): void {
  for (let sweep = 0; sweep < MAX_REFINEMENT_SWEEPS; sweep++) {
    let changed = false;
    for (const [index, label] of labels.entries()) {
      const others = othersOf(labels, index);
      const currentScore = scorePlacement(label, label.placement, others, []);
      const best = bestPlacement(label, others, []);
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

function hasConflict(score: number): boolean {
  return score >= LEADER_THROUGH_OBSTACLE_COST;
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

// Slots for a label that are free of dots and blocked by only one or two other
// labels, cheapest first, each paired with its blockers.
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
    if (candidate.overlapsDot) continue;
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

// Simulated-annealing polish for conflicts the greedy passes cannot untangle.
// Besides random single moves it proposes ejections: a conflicted label takes
// a slot its neighbours block, and those neighbours are re-placed at once, so
// a small group of labels can rearrange in a single step.
function polishLayout(labels: LayoutLabel[]): void {
  if (labels.length < 2) return;
  const random = mulberry32(POLISH_SEED);
  const scores = labelScores(labels);
  let total = sum(scores);
  let best = { total, placements: labels.map((label) => label.placement) };
  const temperatureRatio = POLISH_END_TEMPERATURE / POLISH_START_TEMPERATURE;

  let lastImprovement = 0;

  for (let iteration = 0; iteration < POLISH_ITERATIONS; iteration++) {
    if (iteration - lastImprovement > POLISH_STALL_ITERATIONS) break;
    const temperature =
      POLISH_START_TEMPERATURE *
      temperatureRatio ** (iteration / POLISH_ITERATIONS);
    const conflicted = labels
      .map((_, index) => index)
      .filter((index) => hasConflict(scores[index] ?? 0));
    if (conflicted.length === 0) break;

    const index =
      random() < 0.5
        ? conflicted[Math.floor(random() * conflicted.length)] ?? 0
        : Math.floor(random() * labels.length);
    const label = labels[index];
    if (!label) continue;

    const proposals =
      hasConflict(scores[index] ?? 0) && random() < POLISH_EJECTION_PROBABILITY
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

function runLayout(orderedLabels: LayoutLabel[]): {
  labels: LayoutLabel[];
  total: number;
} {
  const labels = greedyLayout(orderedLabels);
  refineLayout(labels);
  return { labels, total: sum(labelScores(labels)) };
}

// Greedy placement, refinement sweeps, and an annealing polish when conflicts
// remain. Overlapping boxes are never accepted while a non-overlapping slot
// exists; if none does, the least-overlapping slot is used so no label vanishes.
export function computeLabelLayout(
  points: LabelLayoutPoint[],
  options: LabelLayoutOptions
): PlacedLabel[] {
  const dotByPoint = new Map<LabelLayoutPoint, Rect>();
  for (const point of points) {
    if (point.isObstacle)
      dotByPoint.set(point, dotRect(point, options.dotRadius));
  }
  const dots = [...dotByPoint.values()];

  const labels: LayoutLabel[] = [];
  for (const point of points) {
    if (!point.wantsLabel) continue;
    const ownDot = dotByPoint.get(point) ?? null;
    const candidates = candidatePlacements(point, ownDot, dots, options);
    const placement = candidates[0];
    if (!placement) continue;
    labels.push({ point, candidates, placement });
  }

  // Large label sets (the "show all labels" mode) cannot be made conflict-free
  // anyway, so they get a single cheap pass instead of the full search.
  const fullSearch = labels.length <= FULL_SEARCH_MAX_LABELS;
  const orderings = fullSearch ? ORDERINGS : ORDERINGS.slice(0, 1);
  let best: { labels: LayoutLabel[]; total: number } | null = null;

  for (const ordering of orderings) {
    const ordered = labels
      .map((label) => ({ ...label }))
      .sort((a, b) => ordering(a.point, b.point));
    const result = runLayout(ordered);
    if (!best || result.total < best.total) best = result;
    if (!labelScores(best.labels).some(hasConflict)) break;
  }

  if (best && fullSearch && labelScores(best.labels).some(hasConflict)) {
    polishLayout(best.labels);
    refineLayout(best.labels);
  }

  return (best?.labels ?? []).map(({ point, placement }) => ({
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
