import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import NumericTimeline from "@/components/charts/numeric_timeline";
import { TimelineChartZoomOption } from "@/types/charts";
import { QuestionType, UserForecastHistory } from "@/types/question";

import { getDiscreteMockData } from "./mock_data";
import { metaArgTypes } from "../config";

const meta = {
  title: "Discrete Question Timeline",
  component: NumericTimeline,
  argTypes: {
    ...metaArgTypes,
  },
} satisfies Meta<typeof NumericTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

const numericOngoingArgs = getDiscreteMockData(false);
const closedArgs = getDiscreteMockData(true);

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

export const Closed: Story = {
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
