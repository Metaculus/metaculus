import {
  CallSeries,
  ChartCall,
  IRAN_CALL,
  KYIV_CALL,
  leadUp,
  UKRAINE_CALL,
} from "../predictions_chart_calls";

const call = (
  series: CallSeries,
  direction: ChartCall["direction"] = "above"
): ChartCall => ({
  postId: 1,
  questionKey: "q",
  versusKey: "v",
  direction,
  threshold: 0.5,
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
      ]),
      "2022-01-06"
    );
    expect(lead).toEqual({ since: "2022-01-03", days: 3, sinceIndex: 2 });
  });

  it("is null when the forecast was on the wrong side going in", () => {
    expect(
      leadUp(
        call([
          ["2022-01-01", 0.7],
          ["2022-01-02", 0.4],
        ]),
        "2022-01-02"
      )
    ).toBeNull();
  });

  it("counts to the event even when the question closed earlier", () => {
    expect(
      leadUp(
        call([
          ["2022-01-01", 0.8],
          ["2022-01-11", 0.9],
        ]),
        "2022-01-21"
      )
    ).toEqual({ since: "2022-01-01", days: 20, sinceIndex: 0 });
  });

  it("calls a non-event when the forecast stays below the threshold", () => {
    const lead = leadUp(
      call(
        [
          ["2022-01-01", 0.7],
          ["2022-01-02", 0.5],
          ["2022-01-03", 0.3],
          ["2022-01-04", 0.1],
        ],
        "below"
      ),
      "2022-01-10"
    );
    expect(lead).toEqual({ since: "2022-01-03", days: 7, sinceIndex: 2 });
  });

  it("matches the lead times quoted for the shipped calls", () => {
    expect(leadUp(UKRAINE_CALL, "2022-02-24")).toMatchObject({
      since: "2022-02-12",
      days: 12,
    });
    expect(leadUp(IRAN_CALL, "2026-02-28")).toMatchObject({
      since: "2026-02-18",
      days: 10,
    });
    expect(leadUp(KYIV_CALL, "2022-04-02")).toMatchObject({
      since: "2022-03-05",
      days: 28,
    });
  });
});
