import { Area, Line } from "@/types/charts";

import {
  getSharedStepKeepMask,
  reduceStepAreaSegments,
  reduceStepLineSegments,
} from "../step_reducer";

describe("reduceStepLineSegments", () => {
  it("removes redundant plateau points while preserving transition timestamps", () => {
    const points: Line = [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 5, y: 2 },
    ];

    expect(reduceStepLineSegments(points)).toEqual([
      { x: 0, y: 1 },
      { x: 3, y: 2 },
      { x: 5, y: 2 },
    ]);
  });

  it("preserves null separators and segment boundaries", () => {
    const points: Line = [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: null },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ];

    expect(reduceStepLineSegments(points)).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: null },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ]);
  });
});

describe("reduceStepAreaSegments", () => {
  it("keeps interval changes when either y or y0 changes", () => {
    const points: Area = [
      { x: 0, y: 4, y0: 1 },
      { x: 1, y: 4, y0: 1 },
      { x: 2, y: 5, y0: 1 },
      { x: 3, y: 5, y0: 2 },
      { x: 4, y: 5, y0: 2 },
    ];

    expect(reduceStepAreaSegments(points)).toEqual([
      { x: 0, y: 4, y0: 1 },
      { x: 2, y: 5, y0: 1 },
      { x: 3, y: 5, y0: 2 },
      { x: 4, y: 5, y0: 2 },
    ]);
  });
});

describe("getSharedStepKeepMask", () => {
  it("keeps endpoints and any index where a series changes value", () => {
    // series A is flat; series B changes at index 3 only.
    const a = [5, 5, 5, 5, 5, 5];
    const b = [1, 1, 1, 9, 9, 9];

    expect(getSharedStepKeepMask([a, b], 6)).toEqual([
      true, // endpoint
      false,
      false,
      true, // B changes here
      false,
      true, // endpoint
    ]);
  });

  it("treats null<->real transitions as changes and keeps them aligned", () => {
    const a = [1, 1, null, 1, 1];
    const b = [2, 2, 2, 2, 2];

    expect(getSharedStepKeepMask([a, b], 5)).toEqual([
      true, // endpoint
      false,
      true, // A goes null
      true, // A comes back
      true, // endpoint
    ]);
  });

  it("returns all-kept for short grids and empty for zero length", () => {
    expect(getSharedStepKeepMask([[1]], 1)).toEqual([true]);
    expect(getSharedStepKeepMask([[1, 2]], 2)).toEqual([true, true]);
    expect(getSharedStepKeepMask([], 0)).toEqual([]);
  });
});
