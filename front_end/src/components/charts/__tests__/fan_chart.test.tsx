import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { FanDatum } from "@/types/charts";
import { QuestionType } from "@/types/question";

import messages from "../../../../messages/en.json";
import FanChart from "../fan_chart";

const option = (
  name: string,
  rangeMax: number,
  communityQuartiles: FanDatum["communityQuartiles"]
): FanDatum => ({
  name,
  type: QuestionType.Numeric,
  optionScaling: {
    range_min: 1899,
    range_max: rangeMax,
    zero_point: null,
  },
  communityQuartiles,
});

const options: FanDatum[] = [
  option("30 April 2026", 15000, {
    lower25: 0.03809499514720306,
    median: 0.07634604595010228,
    upper75: 0.35773159774902025,
  }),
  option("30 June 2026", 30000, {
    lower25: 0.040335273920898855,
    median: 0.07204766585961948,
    upper75: 0.26455927548294494,
  }),
  option("30 September 2026", 60000, {
    lower25: 0.03808927621439637,
    median: 0.06912368951498629,
    upper75: 0.2672595705807746,
  }),
  option("31 December 2026", 120000, null),
];

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => 516,
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get: () => 216,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

describe("FanChart", () => {
  it("shows a tighter nice boundary tick for its quartile bands", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <FanChart options={options} height={216} />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("2500")).toBeInTheDocument();
    expect(screen.getByText("5000")).toBeInTheDocument();
    expect(screen.getByText("10k")).toBeInTheDocument();
  });
});
