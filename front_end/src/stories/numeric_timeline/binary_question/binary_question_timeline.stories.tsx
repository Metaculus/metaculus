import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { TimelineChartZoomOption } from "@/types/charts";
import { QuestionType } from "@/types/question";

import { getBinaryMockData } from "./mock_data";
import NumericTimeline from "../../../components/charts/numeric_timeline";
import { metaArgTypes } from "../config";

type Story = StoryObj<typeof meta>;
const ongoingArgs = getBinaryMockData(false);
const closedArgs = getBinaryMockData(true);
const meta = {
  title: "Binary Question Timeline",
  component: NumericTimeline,
  argTypes: {
    ...metaArgTypes,
  },
} satisfies Meta<typeof NumericTimeline>;

export const Ongoing: Story = {
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
    myForecasts: ongoingArgs.my_forecasts ?? undefined,
    scaling: ongoingArgs.scaling,
    withZoomPicker: true,
    defaultZoom: TimelineChartZoomOption.All,
    questionType: QuestionType.Binary,
    height: 150,
    actualCloseTime: null,
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
    myForecasts: closedArgs.my_forecasts ?? undefined,
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
    resolution: "no",
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

export default meta;
