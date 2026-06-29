import { Area, Line } from "@/types/charts";

import {
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
