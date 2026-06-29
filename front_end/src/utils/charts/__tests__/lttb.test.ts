import { Line } from "@/types/charts";

import { lttb } from "../lttb";

function makePoints(n: number, fn: (i: number) => number): Line {
  return Array.from({ length: n }, (_, i) => ({ x: i, y: fn(i) }));
}

describe("lttb", () => {
  it("returns input unchanged when target is >= input length", () => {
    const points = makePoints(5, (i) => i);
    expect(lttb(points, 5)).toBe(points);
    expect(lttb(points, 10)).toBe(points);
  });

  it("returns input unchanged when target is < 3", () => {
    const points = makePoints(10, (i) => i);
    expect(lttb(points, 2)).toBe(points);
  });

  it("downsamples to the requested count and preserves endpoints", () => {
    const points = makePoints(200, (i) => Math.sin(i / 10));
    const result = lttb(points, 50);
    expect(result).toHaveLength(50);
    expect(result[0]).toEqual(points[0]);
    expect(result[result.length - 1]).toEqual(points[points.length - 1]);
  });

  it("keeps the visually important peak of a spike", () => {
    const points = makePoints(100, (i) => (i === 50 ? 1000 : 0));
    const result = lttb(points, 10);
    expect(result.some((p) => p.y === 1000)).toBe(true);
  });

  it("skips points with non-numeric y", () => {
    const points: Line = [
      { x: 0, y: 0 },
      { x: 1, y: null },
      { x: 2, y: 5 },
      { x: 3, y: null },
      { x: 4, y: 2 },
      { x: 5, y: 8 },
      { x: 6, y: 3 },
      { x: 7, y: 1 },
    ];
    const result = lttb(points, 4);
    expect(result).toHaveLength(4);
    expect(result.every((p) => p.y !== null)).toBe(true);
  });

  it("does not coerce a null y into a real y=0 sample", () => {
    // A null sits among uniformly high values. If null were coerced to 0,
    // LTTB would treat it as a large downward spike and select it.
    const points: Line = [
      { x: 0, y: 10 },
      { x: 1, y: 10 },
      { x: 2, y: null },
      { x: 3, y: 10 },
      { x: 4, y: 10 },
      { x: 5, y: 10 },
    ];
    const result = lttb(points, 4);
    expect(result.some((p) => p.y === null)).toBe(false);
  });
});
