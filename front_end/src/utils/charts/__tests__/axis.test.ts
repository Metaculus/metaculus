import { TimelineChartZoomOption } from "@/types/charts";
import { QuestionType } from "@/types/question";

import { generateScale, generateTimeSeriesYDomain } from "../axis";

describe("generateScale", () => {
  describe("numeric scale", () => {
    it("should generate basic numeric scale with default domain", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 200,
      });

      expect(scale.ticks).toBeDefined();
      expect(scale.tickFormat).toBeDefined();
      expect(scale.cursorFormat).toBeDefined();

      // Check if ticks are within domain [0, 1]
      scale.ticks.forEach((tick) => {
        expect(tick).toBeGreaterThanOrEqual(0);
        expect(tick).toBeLessThanOrEqual(1);
      });

      // Check if tick format returns strings
      const firstTick = scale.ticks[0];
      if (firstTick !== undefined && scale.tickFormat && scale.cursorFormat) {
        expect(typeof scale.tickFormat(firstTick)).toBe("string");
        expect(typeof scale.cursorFormat(firstTick)).toBe("string");
      }
    });

    it("should respect custom domain", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 200,
        domain: [0, 40],
        zoomedDomain: [10, 20],
      });

      // Check if ticks are within custom domain [10, 20]
      scale.ticks.forEach((tick) => {
        expect(tick).toBeGreaterThanOrEqual(10);
        expect(tick).toBeLessThanOrEqual(20);
      });
    });

    it("should append unit to tick labels when provided", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 200,
        unit: "%",
      });

      const firstTick = scale.ticks[0];
      if (firstTick !== undefined && scale.tickFormat) {
        const label = scale.tickFormat(firstTick, 0);
        expect(label).toContain("%");
      }
    });
  });

  describe("discrete scale", () => {
    it("should generate discrete scale with inbound outcome count", () => {
      const scale = generateScale({
        displayType: QuestionType.Discrete,
        axisLength: 200,
        inboundOutcomeCount: 3,
      });

      expect(scale.ticks.length).toBeGreaterThan(0);

      // For discrete scale with 3 outcomes, we expect values between -0.5 and 1.5
      scale.ticks.forEach((tick) => {
        expect(tick).toBeGreaterThanOrEqual(-0.5);
        expect(tick).toBeLessThanOrEqual(1.5);
      });
    });

    it("should handle forced tick count", () => {
      const forcedCount = 5;
      const scale = generateScale({
        displayType: QuestionType.Discrete,
        axisLength: 200,
        forceTickCount: forcedCount,
      });

      expect(scale.ticks.length).toBe(forcedCount);
    });
  });

  describe("axis length behavior", () => {
    it("should generate fewer ticks for small axis length", () => {
      const smallScale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 50,
      });

      const largeScale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 500,
      });

      expect(smallScale.ticks.length).toBeLessThan(largeScale.ticks.length);
    });

    it("should handle vertical direction", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 200,
        direction: "vertical",
      });

      expect(scale.ticks).toBeDefined();
      expect(scale.tickFormat).toBeDefined();
      expect(scale.ticks.length).toBeGreaterThan(0);
    });
  });

  describe("scaling behavior", () => {
    it("should apply custom scaling", () => {
      const scale = generateScale({
        displayType: QuestionType.Numeric,
        axisLength: 200,
        scaling: {
          range_min: 0,
          range_max: 100,
          zero_point: 50,
        },
      });

      const firstTick = scale.ticks[0];
      if (firstTick !== undefined && scale.cursorFormat) {
        const label = scale.cursorFormat(firstTick);

        expect(label).toBeDefined();
        expect(typeof label).toBe("string");
      }
    });
  });

  // TODO: uncoment when this will be fixed
  // describe("fan graph ticks", () => {
  //   it("tick format should return a valid string for at least 3 ticks", () => {
  //     const scale = generateScale({
  //       displayType: QuestionType.Numeric,
  //       axisLength: 200,
  //       scaling: {
  //         range_min: 50000000,
  //         range_max: 20000000000,
  //         zero_point: 0,
  //       },
  //       domain: [0, 1],
  //       zoomedDomain: [0.27264762227152306, 0.8262996659589331],
  //       direction: "vertical",
  //     });

  //     const formatedLables = scale.ticks
  //       .map((tick) => scale.tickFormat(tick))
  //       .filter((label) => label !== "");
  //     expect(formatedLables.length).toBeGreaterThan(2);
  //   });
  // });
  describe("graph ticks formatting", () => {
    it("tick format should return a valid string for at least 3 ticks", () => {
      const scale = generateScale({
        displayType: QuestionType.Date,
        axisLength: 200,
        scaling: {
          range_max: 1778803200,
          range_min: 1678838400,
          zero_point: null,
        },
        domain: [0, 1],
        zoomedDomain: [0, 1],
        direction: "vertical",
      });

      const formatedLables = scale.ticks
        .map((tick) => scale.tickFormat(tick))
        .filter((label) => label !== "");
      expect(formatedLables.length).toBeGreaterThan(2);
    });
  });
  // TODO: uncoment when this will be fixed
  // describe("graph force ticks count", () => {
  //   it("helper should return specified number of ticks", () => {
  //     const FORCE_TICK_COUNT = 5;
  //     const scale = generateScale({
  //       displayType: QuestionType.Date,
  //       axisLength: 200,
  //       scaling: {
  //         range_max: 1778803200,
  //         range_min: 1678838400,
  //         zero_point: null,
  //       },
  //       domain: [0, 1],
  //       zoomedDomain: [0, 1],
  //       direction: "vertical",
  //       forceTickCount: FORCE_TICK_COUNT,
  //     });

  //     expect(scale.ticks.length).toBe(FORCE_TICK_COUNT);
  //   });
  // });
});

describe("generateTimeSeriesYDomain", () => {
  it("should return original domain if chart is empty", () => {
    const scale = generateTimeSeriesYDomain({
      zoom: TimelineChartZoomOption.All,
      isChartEmpty: true,
      minValues: [],
      maxValues: [],
      minTimestamp: 0,
    });
    expect(scale.originalYDomain).toEqual([0, 1]);
    expect(scale.zoomedYDomain).toEqual([0, 1]);
  });

  it("should always return either 0 or 1 for binary question", () => {
    const scale = generateTimeSeriesYDomain({
      zoom: TimelineChartZoomOption.All,
      isChartEmpty: false,
      minValues: [
        {
          timestamp: 1751271599.875,
          y: 0.3,
        },
        {
          timestamp: 1751537899.677,
          y: 0.33,
        },
        {
          timestamp: 1751285580,
          y: 0.33,
        },
      ],
      maxValues: [
        {
          timestamp: 1751271599.875,
          y: 0.3,
        },
        {
          timestamp: 1751537899.677,
          y: 0.33,
        },
        {
          timestamp: 1751285580,
          y: 0.33,
        },
      ],
      minTimestamp: 1751271599.875,
      includeClosestBoundOnZoom: true,
    });
    expect(scale.originalYDomain).toEqual([0, 1]);
    expect(scale.zoomedYDomain[0] === 0 || scale.zoomedYDomain[1] === 1).toBe(
      true
    );
  });
});
