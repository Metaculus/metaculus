import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import NumericTimeline from "@/components/charts/numeric_timeline";
import { getNumericMockData } from "./mock_data";
import { useState } from "react";
import { TimelineChartZoomOption } from "@/types/charts";
import { QuestionType, UserForecastHistory } from "@/types/question";

const meta = {
  title: "Numeric Question Timeline",
  component: NumericTimeline,
  argTypes: {
    withZoomPicker: {
      control: {
        type: "boolean",
      },
    },
    defaultZoom: {
      control: "select",
    },
  },
} satisfies Meta<typeof NumericTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

const numericOngoingArgs = getNumericMockData(false);

export const Ongoing: Story = {
  name: "Ongoing",
  render: (args) => {
    const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
    return (
      <NumericTimeline
        {...args}
        cursorTimestamp={cursorTimestamp}
        onCursorChange={setCursorTimestamp}
      />
    );
  },
  args: {
    aggregation: numericOngoingArgs.aggregation,
    myForecasts: numericOngoingArgs.my_forecasts as UserForecastHistory,
    scaling: numericOngoingArgs.scaling,
    withZoomPicker: true,
    defaultZoom: TimelineChartZoomOption.All,
    questionType: QuestionType.Numeric,
    height: 150,
    actualCloseTime: null,
    simplifiedCursor: true,
    unit: "$",
  },
};

export const CpHidden: Story = {
  name: "CP hidden",
  render: (args) => {
    const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
    return (
      <NumericTimeline
        {...args}
        cursorTimestamp={cursorTimestamp}
        onCursorChange={setCursorTimestamp}
      />
    );
  },
  args: {
    ...Ongoing.args,
    hideCP: true,
    isEmptyDomain: true,
  },
};

const closedArgs = getNumericMockData(true);
export const Closed: Story = {
  name: "Closed",
  render: (args) => {
    const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
    return (
      <NumericTimeline
        {...args}
        cursorTimestamp={cursorTimestamp}
        onCursorChange={setCursorTimestamp}
      />
    );
  },
  args: {
    ...Ongoing.args,
    aggregation: closedArgs.aggregation,
    actualCloseTime: closedArgs.actualCloseTime,
  },
};

export const Resolved: Story = {
  name: "Resolved",
  render: (args) => {
    const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
    return (
      <NumericTimeline
        {...args}
        cursorTimestamp={cursorTimestamp}
        onCursorChange={setCursorTimestamp}
      />
    );
  },
  args: {
    ...Closed.args,
    resolution: closedArgs.resolution,
    resolveTime: closedArgs.actualResolveTime,
  },
};

export const OngoingEmbedded: Story = {
  name: "Ongoing embedded",
  render: (args) => {
    const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
    return (
      <NumericTimeline
        {...args}
        cursorTimestamp={cursorTimestamp}
        onCursorChange={setCursorTimestamp}
      />
    );
  },
  args: {
    ...Ongoing.args,
    isEmbedded: true,
    simplifiedCursor: true,
    isEmptyDomain: true,
    extraTheme: numericOngoingArgs.embedTheme,
  },
};
