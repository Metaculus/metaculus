import {
  type Rect,
  rectsOverlap,
  segmentIntersectsRect,
  segmentsIntersect,
  getSafeBounds,
} from "../helpers";
import {
  computeLabelLayout,
  createLabelLayoutMemory,
  type LabelLayoutMemory,
  type LabelLayoutOptions,
  type LabelLayoutPoint,
  type PlacedLabel,
} from "../label-layout";

const FONT_SIZE = 12;
const RECT_PADDING = 3.5;
const DOT_RADIUS = 6;
const SAFE_BOUNDS = getSafeBounds(
  { top: 30, bottom: 80, left: 50, right: 30 },
  900,
  600,
  8.5
);

const measureText = (text: string, fontSize: number) =>
  Math.ceil(text.length * fontSize * 0.6);

function layout(
  points: LabelLayoutPoint[],
  extra: Pick<LabelLayoutOptions, "extraObstacles" | "lineObstacles"> = {},
  memory?: LabelLayoutMemory
): PlacedLabel[] {
  return computeLabelLayout(
    points,
    {
      safeBounds: SAFE_BOUNDS,
      fontSize: FONT_SIZE,
      measureText,
      rectPadding: RECT_PADDING,
      dotRadius: DOT_RADIUS,
      ...extra,
    },
    memory
  );
}

function rectsByName(placed: PlacedLabel[]): Record<string, Rect> {
  return Object.fromEntries(placed.map((label) => [label.name, label.rect]));
}

function dotRect(point: { x: number; y: number }): Rect {
  return {
    x: point.x - DOT_RADIUS,
    y: point.y - DOT_RADIUS,
    width: DOT_RADIUS * 2,
    height: DOT_RADIUS * 2,
  };
}

function expectCleanLayout(
  points: LabelLayoutPoint[],
  placed: PlacedLabel[],
  { allowLeaderCrossings = false } = {}
): void {
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      if (!a || !b) throw new Error("missing placed label");
      expect({
        pair: [a.name, b.name],
        overlaps: rectsOverlap(a.rect, b.rect),
      }).toEqual({ pair: [a.name, b.name], overlaps: false });
    }
  }
  for (const label of placed) {
    for (const point of points) {
      if (!point.isObstacle) continue;
      expect({
        label: label.name,
        dot: point.name,
        overlaps: rectsOverlap(label.rect, dotRect(point)),
      }).toEqual({ label: label.name, dot: point.name, overlaps: false });
    }
    for (const other of placed) {
      if (other === label) continue;
      expect({
        leader: label.name,
        crosses: other.name,
        hit: segmentIntersectsRect(label, label.leaderEnd, other.rect),
      }).toEqual({ leader: label.name, crosses: other.name, hit: false });
    }
    for (const other of placed) {
      if (other === label || allowLeaderCrossings) continue;
      expect({
        leaders: [label.name, other.name],
        cross: segmentsIntersect(
          label,
          label.leaderEnd,
          other,
          other.leaderEnd
        ),
      }).toEqual({ leaders: [label.name, other.name], cross: false });
    }
    expect(label.rect.x).toBeGreaterThanOrEqual(SAFE_BOUNDS.left);
    expect(label.rect.y).toBeGreaterThanOrEqual(SAFE_BOUNDS.top);
    expect(label.rect.x + label.rect.width).toBeLessThanOrEqual(
      SAFE_BOUNDS.right
    );
    expect(label.rect.y + label.rect.height).toBeLessThanOrEqual(
      SAFE_BOUNDS.bottom
    );
  }
}

// Pixel positions transcribed from the live chart (900x600), where the six
// frontier stars sit within ~150px of each other above a band of other models.
const FRONTIER_STARS = [
  ["GPT-4o", 108, 311],
  ["Claude 3.5 Sonnet (Oct)", 252, 283],
  ["OpenAI o1 High", 291, 246],
  ["OpenAI o3", 406, 220],
  ["GPT 5.1 High", 588, 224],
  ["Gemini 3.1 Pro High", 677, 222],
  ["T-5.5 Instant High", 732, 215],
  ["Claude Fable 5 High", 768, 213],
  ["Claude Opus 5 High", 776, 210],
  ["Claude Opus 5.1 High", 816, 206],
] as const;
const FRONTIER_DOTS = [
  [142, 329],
  [170, 383],
  [218, 385],
  [286, 348],
  [291, 258],
  [330, 292],
  [338, 359],
  [344, 277],
  [353, 297],
  [360, 299],
  [368, 329],
  [396, 351],
  [401, 373],
  [406, 369],
  [406, 314],
  [406, 392],
  [406, 455],
  [439, 294],
  [459, 376],
  [462, 292],
  [476, 281],
  [480, 289],
  [490, 306],
  [501, 246],
  [504, 304],
  [504, 309],
  [504, 358],
  [507, 282],
  [516, 292],
  [537, 292],
  [542, 310],
  [546, 258],
  [549, 271],
  [556, 313],
  [561, 302],
  [567, 294],
  [574, 282],
  [582, 277],
  [588, 287],
  [590, 303],
  [593, 260],
  [599, 310],
  [614, 307],
  [614, 288],
  [618, 279],
  [618, 269],
  [657, 267],
  [661, 258],
  [669, 342],
  [671, 328],
  [675, 280],
  [682, 260],
  [685, 271],
  [689, 282],
  [691, 286],
  [694, 325],
  [700, 272],
  [711, 268],
  [711, 319],
  [715, 299],
  [726, 263],
  [729, 256],
  [730, 269],
  [734, 267],
  [739, 285],
  [743, 259],
  [747, 301],
  [757, 282],
  [761, 278],
  [764, 273],
  [769, 260],
  [778, 262],
  [784, 269],
  [794, 246],
  [801, 257],
  [807, 277],
  [809, 299],
  [812, 279],
  [812, 313],
];

function frontierCluster(): LabelLayoutPoint[] {
  return [
    ...FRONTIER_STARS.map(([name, x, y]) => ({
      name,
      x,
      y,
      isObstacle: true,
      wantsLabel: true,
    })),
    ...FRONTIER_DOTS.map(([x, y], index) => ({
      name: `dot-${index}`,
      x: x ?? 0,
      y: y ?? 0,
      isObstacle: true,
      wantsLabel: false,
    })),
  ];
}

describe("computeLabelLayout", () => {
  it("places every label in a dense frontier cluster without overlaps", () => {
    const points = frontierCluster();
    const placed = layout(points);
    expect(placed.map((label) => label.name).sort()).toEqual(
      points
        .filter((point) => point.wantsLabel)
        .map((point) => point.name)
        .sort()
    );
    // Leader lines may cross each other in this jammed cluster; boxes must not.
    expectCleanLayout(points, placed, { allowLeaderCrossings: true });
  });

  it("keeps labels inside the safe bounds for points at chart corners", () => {
    const points: LabelLayoutPoint[] = [
      { name: "Top Left", x: 60, y: 40, isObstacle: true, wantsLabel: true },
      { name: "Top Right", x: 868, y: 40, isObstacle: true, wantsLabel: true },
      {
        name: "Bottom Right",
        x: 868,
        y: 518,
        isObstacle: true,
        wantsLabel: true,
      },
      {
        name: "Bottom Left",
        x: 60,
        y: 518,
        isObstacle: true,
        wantsLabel: true,
      },
    ];
    const placed = layout(points);
    expect(placed).toHaveLength(4);
    expectCleanLayout(points, placed);
  });

  it("uses the nearest slot when a point has room around it", () => {
    const [placed] = layout([
      { name: "Lonely", x: 400, y: 300, isObstacle: true, wantsLabel: true },
    ]);
    if (!placed) throw new Error("label not placed");
    expect(placed.anchor).toBe("start");
    expect(placed.labelX - 400).toBeGreaterThan(6);
    expect(placed.labelX - 400).toBeLessThan(24);
    expect(Math.abs(placed.labelY - 300)).toBeLessThan(16);
  });

  it("treats unlabeled visible dots as obstacles but never labels them", () => {
    const points: LabelLayoutPoint[] = [
      { name: "Labeled", x: 400, y: 300, isObstacle: true, wantsLabel: true },
      { name: "Blocker", x: 425, y: 296, isObstacle: true, wantsLabel: false },
      { name: "Faded", x: 300, y: 300, isObstacle: false, wantsLabel: false },
    ];
    const placed = layout(points);
    expect(placed.map((label) => label.name)).toEqual(["Labeled"]);
    expectCleanLayout(points, placed);
  });

  it("keeps label boxes off drawn lines and caption boxes when it can", () => {
    const point: LabelLayoutPoint = {
      name: "On The Line",
      x: 400,
      y: 300,
      isObstacle: true,
      wantsLabel: true,
    };
    // A horizontal line through the cheapest slot (just above and right of
    // the point) and a caption box in the next-cheapest one.
    const lineY = 293;
    const captionBox: Rect = { x: 300, y: 285, width: 90, height: 16 };
    const [placed] = layout([point], {
      lineObstacles: [
        [
          { x: SAFE_BOUNDS.left, y: lineY },
          { x: SAFE_BOUNDS.right, y: lineY },
        ],
      ],
      extraObstacles: [captionBox],
    });
    if (!placed) throw new Error("label not placed");
    const crossesLine =
      placed.rect.y <= lineY && placed.rect.y + placed.rect.height >= lineY;
    expect(crossesLine).toBe(false);
    expect(rectsOverlap(placed.rect, captionBox)).toBe(false);
    expect(Math.hypot(placed.labelX - 400, placed.labelY - 300)).toBeLessThan(
      80
    );
  });

  it("adds and removes a hovered label without moving the others", () => {
    const memory = createLabelLayoutMemory();
    const base = frontierCluster();
    const before = layout(base, {}, memory);
    expect(before).toHaveLength(FRONTIER_STARS.length);

    const hovered = base.map((point) =>
      point.name === "dot-40"
        ? { ...point, name: "Hovered Model Name", wantsLabel: true }
        : point
    );
    const during = layout(hovered, {}, memory);
    expect(during).toHaveLength(FRONTIER_STARS.length + 1);
    expect(rectsByName(during)).toMatchObject(rectsByName(before));
    const hoveredLabel = during.find(
      (label) => label.name === "Hovered Model Name"
    );
    if (!hoveredLabel) throw new Error("hovered label not placed");
    // The hovered label must not cover anything; in a jammed cluster its
    // leader line is allowed to pass over a neighbouring label.
    for (const other of during) {
      if (other === hoveredLabel) continue;
      expect(rectsOverlap(hoveredLabel.rect, other.rect)).toBe(false);
    }
    for (const point of hovered) {
      if (!point.isObstacle) continue;
      expect(rectsOverlap(hoveredLabel.rect, dotRect(point))).toBe(false);
    }

    const after = layout(base, {}, memory);
    expect(rectsByName(after)).toEqual(rectsByName(before));
  });

  it("hovering an already-labelled point changes nothing", () => {
    const memory = createLabelLayoutMemory();
    const base = frontierCluster();
    const before = layout(base, {}, memory);
    const again = layout(base, {}, memory);
    expect(rectsByName(again)).toEqual(rectsByName(before));
  });

  it("handles a full-chart label set without dropping labels", () => {
    const points: LabelLayoutPoint[] = [];
    let index = 0;
    for (let x = 80; x <= 840; x += 80) {
      for (let y = 60; y <= 500; y += 60) {
        points.push({
          name: `Model ${index++}`,
          x,
          y,
          isObstacle: true,
          wantsLabel: true,
        });
      }
    }
    const placed = layout(points);
    expect(placed).toHaveLength(points.length);
    expectCleanLayout(points, placed, { allowLeaderCrossings: true });
  });
});
