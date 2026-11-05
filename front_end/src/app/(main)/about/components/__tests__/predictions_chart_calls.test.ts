import {
  CallSeries,
  ChartCall,
  IRAN_CALL,
  leadUp,
  UKRAINE_CALL,
} from "../predictions_chart_calls";

const call = (series: CallSeries, threshold = 0.5): ChartCall => ({
  postId: 1,
  questionKey: "q",
  kind: "probability",
  threshold,
  thresholdDisplay: threshold,
  series,
});

describe("leadUp", () => {
  it("counts from the start of the final unbroken run at or above the threshold", () => {
    const lead = leadUp(
      call([
        ["2022-01-01", 0.6],
        ["2022-01-02", 0.4],
        ["2022-01-03", 0.5],
        ["2022-01-04", 0.7],
        ["2022-01-06", 0.9],
      ])
    );
    expect(lead).toEqual({ since: "2022-01-03", days: 3, sinceIndex: 2 });
  });

  it("is null when the forecast was below the threshold going in", () => {
    expect(
      leadUp(
        call([
          ["2022-01-01", 0.7],
          ["2022-01-02", 0.4],
        ])
      )
    ).toBeNull();
  });

  it("covers the whole series when it never dipped", () => {
    expect(
      leadUp(
        call([
          ["2022-01-01", 0.8],
          ["2022-01-11", 0.9],
        ])
      )
    ).toEqual({ since: "2022-01-01", days: 10, sinceIndex: 0 });
  });

  it("matches the lead times quoted for the shipped calls", () => {
    expect(leadUp(UKRAINE_CALL)?.since).toBe("2022-02-12");
    expect(leadUp(UKRAINE_CALL)?.days).toBe(12);
    expect(leadUp(IRAN_CALL)?.since).toBe("2026-02-18");
    expect(leadUp(IRAN_CALL)?.days).toBe(10);
  });
});
