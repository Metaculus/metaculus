import {
  Box,
  collides,
  initialVisible,
  nextSwap,
  RotationSlot,
} from "../predictions_chart_rotation";

// Labels 100 wide centred on x, alternating above and below the line
const box = (x: number, above: boolean): Box[] => [
  { x0: x - 50, y0: above ? 100 : 300, x1: x + 50, y1: above ? 160 : 360 },
];

const slots: RotationSlot[] = [
  300, 380, 450, 520, 600, 660, 720, 790, 860, 930, 1000,
].map((x, i) => ({
  id: String.fromCharCode(97 + i),
  x,
  boxes: box(x, i % 2 === 0),
}));

// Deterministic generator so the run is reproducible
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

function run(
  steps: number,
  seed: number,
  onSwap?: (
    swap: { leaving?: string; entering?: string },
    before: string[]
  ) => void
) {
  const random = seeded(seed);
  let visible = initialVisible(slots, 4);
  const recent: string[] = [];
  const seen = new Set(visible);
  for (let i = 0; i < steps; i++) {
    const swap = nextSwap(slots, visible, recent, 4, random);
    if (!swap) throw new Error("rotation stalled");
    onSwap?.(swap, visible);
    if (swap.leaving) {
      recent.unshift(swap.leaving);
      recent.length = Math.min(recent.length, 2);
    }
    visible = visible.filter((id) => id !== swap.leaving);
    if (swap.entering) {
      visible.push(swap.entering);
      seen.add(swap.entering);
    }
  }
  return { visible, seen };
}

describe("initialVisible", () => {
  it("spreads the first labels across the line", () => {
    expect(initialVisible(slots, 4)).toEqual(["a", "d", "h", "k"]);
  });

  it("prefers events flagged initial", () => {
    const flagged = slots.map((s) => ({
      ...s,
      initial: s.id === "b" || s.id === "e",
    }));
    expect(initialVisible(flagged, 4)).toEqual(["b", "e"]);
  });
});

describe("nextSwap", () => {
  it("retires the label shown longest", () => {
    const swap = nextSwap(slots, ["a", "d", "h", "k"], [], 4, () => 0.5);
    expect(swap?.leaving).toBe("a");
    expect(["a", "d", "h", "k"]).not.toContain(swap?.entering);
  });

  it("never brings in a label overlapping one on screen", () => {
    run(300, 3, (swap, before) => {
      const entering = slots.find((s) => s.id === swap.entering);
      for (const id of before) {
        const other = slots.find((s) => s.id === id);
        expect(collides(entering?.boxes, other?.boxes)).toBe(false);
      }
    });
  });

  it("never brings back the label that just left", () => {
    let lastLeft: string | undefined;
    run(300, 5, (swap) => {
      if (lastLeft) expect(swap.entering).not.toBe(lastLeft);
      if (swap.leaving) lastLeft = swap.leaving;
    });
  });

  it("never retires the label that just arrived", () => {
    let lastEntered: string | undefined;
    run(300, 9, (swap) => {
      if (lastEntered) expect(swap.leaving).not.toBe(lastEntered);
      if (swap.entering) lastEntered = swap.entering;
    });
  });

  it("keeps 3-4 labels up and every label in circulation", () => {
    const { visible, seen } = run(200, 7, (_, before) => {
      expect(before.length).toBeGreaterThanOrEqual(3);
      expect(before.length).toBeLessThanOrEqual(4);
    });
    expect(new Set(visible).size).toBe(visible.length);
    expect(seen.size).toBe(slots.length);
  });

  it("fades one out alone when nothing hidden fits, then refills", () => {
    // Every hidden label overlaps one on screen
    const crowded: RotationSlot[] = [
      { id: "p", x: 100, boxes: [{ x0: 0, y0: 0, x1: 200, y1: 50 }] },
      { id: "q", x: 400, boxes: [{ x0: 300, y0: 0, x1: 500, y1: 50 }] },
      { id: "r", x: 120, boxes: [{ x0: 20, y0: 0, x1: 220, y1: 50 }] },
    ];
    expect(nextSwap(crowded, ["p", "q"], [], 2)).toEqual({ leaving: "p" });
    // Next tick: one short, so only add (and "p" just left)
    expect(nextSwap(crowded, ["q"], ["p"], 2)).toEqual({
      leaving: undefined,
      entering: "r",
    });
  });

  it("does nothing when there is nothing to rotate", () => {
    expect(nextSwap(slots.slice(0, 1), ["a"], [], 4)).toBeNull();
  });

  it("mostly replaces a label with a neighbour, sometimes from afar", () => {
    const spaced = slots.map((s) => ({ ...s, boxes: undefined }));
    const random = seeded(1);
    let near = 0;
    let far = 0;
    for (let i = 0; i < 500; i++) {
      const swap = nextSwap(spaced, ["e", "a", "k", "h"], [], 4, random);
      if (swap?.entering === "d" || swap?.entering === "f") near++;
      if (swap?.entering === "j") far++;
    }
    expect(near).toBeGreaterThan(far * 2);
    expect(far).toBeGreaterThan(0);
  });
});
