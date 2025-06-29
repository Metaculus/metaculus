import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import NumericTimeline from "../../components/charts/numeric_timeline";
import { binaryMockAggregation } from "./mock_data";
import { useState } from "react";
import { TimelineChartZoomOption } from "@/types/charts";
import { QuestionType } from "@/types/question";

const meta = {
  title: "Numeric Timeline",
  component: NumericTimeline,

  argTypes: {
    aggregation: {
      control: {
        type: "select",
        options: [binaryMockAggregation],
      },
    },
    withZoomPicker: {
      control: {
        type: "boolean",
      },
    },
    defaultZoom: {
      control: {
        type: "select",
        options: [...Object.values(TimelineChartZoomOption)],
      },
    },
    questionType: {
      control: {
        type: "select",
        options: Object.values(QuestionType),
      },
    },
  },
} satisfies Meta<typeof NumericTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
    aggregation: binaryMockAggregation,
    withZoomPicker: true,
    defaultZoom: TimelineChartZoomOption.All,
  },
};
