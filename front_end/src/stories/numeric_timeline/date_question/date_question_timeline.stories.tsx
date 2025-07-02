import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import NumericTimeline from "../../../components/charts/numeric_timeline";
import { getDateMockData } from "./mock_data";
import { useState } from "react";
import { TimelineChartZoomOption } from "@/types/charts";
import { QuestionType, UserForecastHistory } from "@/types/question";

const ongoingArgs = getDateMockData(false);
const closedArgs = getDateMockData(true);

const meta = {
  title: "Date Question Timeline",
  component: NumericTimeline,
  argTypes: {
    withZoomPicker: {
      control: {
        type: "boolean",
      },
    },
    myForecasts: {
      control: { type: "select" },
      options: ["Default", "None"],
      mapping: {
        Default: ongoingArgs.my_forecasts,
        None: null,
      },
    },
    defaultZoom: {
      control: "select",
    },
  },
} satisfies Meta<typeof NumericTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

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
    aggregation: ongoingArgs.aggregation,
    myForecasts: ongoingArgs.my_forecasts as UserForecastHistory,
    scaling: ongoingArgs.scaling,
    withZoomPicker: true,
    defaultZoom: TimelineChartZoomOption.All,
    questionType: QuestionType.Date,
    height: 150,
    actualCloseTime: null,
    simplifiedCursor: true,
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
    extraTheme: ongoingArgs.embedTheme,
  },
};
