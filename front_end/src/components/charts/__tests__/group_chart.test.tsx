import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { METAC_COLORS } from "@/constants/colors";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { QuestionType } from "@/types/question";

import messages from "../../../../messages/en.json";
import GroupChart from "../group_chart";

const choiceItem: ChoiceItem = {
  choice: "Median only",
  color: METAC_COLORS.blue["500"],
  highlighted: false,
  active: true,
  resolution: null,
  aggregationTimestamps: [100, 200],
  aggregationValues: [0.4, 0.6],
  aggregationMinValues: [null, null],
  aggregationMaxValues: [null, null],
  aggregationForecasterCounts: [10, 10],
  latestValue: 0.6,
  userTimestamps: [],
  userValues: [],
  scaling: {
    range_min: 0,
    range_max: 100,
    zero_point: null,
  },
};

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

describe("GroupChart", () => {
  it("uses visible uncertainty intervals with no span padding by default", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GroupChart
          timestamps={[100, 200]}
          actualCloseTime={200_000}
          choiceItems={[
            {
              ...choiceItem,
              aggregationMinValues: [0.1, 0.1],
              aggregationMaxValues: [0.9, 0.9],
            },
          ]}
          height={216}
          questionType={QuestionType.Numeric}
          scaling={{ range_min: 0, range_max: 100, zero_point: null }}
        />
      </NextIntlClientProvider>
    );

    ["0", "20", "40", "60", "80", "100"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.queryByText("25")).not.toBeInTheDocument();
  });

  it("uses community medians when uncertainty bands are unavailable", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GroupChart
          timestamps={[100, 200]}
          actualCloseTime={200_000}
          choiceItems={[choiceItem]}
          height={216}
          questionType={QuestionType.Numeric}
          scaling={{ range_min: 0, range_max: 100, zero_point: null }}
          yDomainOptions={{
            scope: "fullHistory",
            source: "intervals",
            paddingRatio: 0.1,
          }}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("100")).not.toBeInTheDocument();
  });

  it("carries an active uncertainty interval into a shorter zoom window", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <GroupChart
          timestamps={[100]}
          actualCloseTime={1_000_000_000}
          choiceItems={[
            {
              ...choiceItem,
              aggregationTimestamps: [100],
              aggregationValues: [0.5],
              aggregationMinValues: [0.4],
              aggregationMaxValues: [0.6],
              closeTime: 2_000_000_000,
            },
          ]}
          defaultZoom={TimelineChartZoomOption.OneDay}
          height={216}
          questionType={QuestionType.Numeric}
          scaling={{ range_min: 0, range_max: 100, zero_point: null }}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.queryByText("100")).not.toBeInTheDocument();
  });
});
