import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import ConsumerPostCard from "@/components/consumer_post_card";
import PostCard from "@/components/post_card";
import { createConditionalRenderer } from "@/stories/utils/renderer/conditional-renderer";
import { stripUserPredictions } from "@/stories/utils/transforms/strip_user_predictions";
import { PostWithForecasts } from "@/types/post";

import { getMockData } from "./mock_data";

const ongoingArgs = getMockData(false);
const closedArgs = getMockData(true);

type StoryProps = {
  post: PostWithForecasts;
  forCommunityFeed?: boolean;
  isConsumer?: boolean;
  hideUserPredictions?: boolean;
};

const meta = {
  title: "Feed Card/Numeric Group/Numeric Timeline Chart",
  component: PostCard,
  argTypes: {
    isConsumer: {
      control: {
        type: "boolean",
        order: 0,
      },
    },
    post: {
      control: {
        type: "object",
      },
    },
    hideUserPredictions: {
      control: { type: "boolean" },
      description: "Hide user predictions in graph cards",
    },
    forCommunityFeed: {
      table: {
        disable: true,
      },
    },
  },
} satisfies Meta<StoryProps>;

export default meta;

type Story = StoryObj<StoryProps>;

const render = createConditionalRenderer<StoryProps>({
  componentSelector: (args) => (args.isConsumer ? ConsumerPostCard : PostCard),
  transformRules: [
    {
      key: "hideUserPredictions",
      when: (args) => args.hideUserPredictions === true,
      transform: (args) => ({
        ...args,
        post: stripUserPredictions(args.post),
      }),
    },
  ],
});

export const Ongoing: Story = {
  render,
  args: {
    post: ongoingArgs as unknown as PostWithForecasts,
    isConsumer: false,
    hideUserPredictions: false,
  },
};

export const CpHidden: Story = {
  render,
  args: {
    post: {
      ...ongoingArgs,
      group_of_questions: {
        ...ongoingArgs.group_of_questions,
        questions: ongoingArgs.group_of_questions.questions.map((question) => ({
          ...question,
          status: "open",
          resolution: null,
          cp_reveal_time: "2025-12-24T21:51:51Z",
          aggregations: { recency_weighted: { history: [] } },
          my_forecasts: { history: [] },
        })),
      },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
  },
};

export const Closed: Story = {
  render,
  args: {
    post: {
      ...ongoingArgs,
      status: "closed",
      group_of_questions: {
        ...ongoingArgs.group_of_questions,
        questions: ongoingArgs.group_of_questions.questions.map((question) => ({
          ...question,
          status: "open",
          actual_resolve_time: question.actual_resolve_time,
          actual_close_time: question.actual_close_time,
          resolution: null,
        })),
      },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
  },
};

export const Resolved: Story = {
  render,
  args: {
    post: {
      ...closedArgs,
      status: "closed",
      group_of_questions: {
        ...closedArgs.group_of_questions,
        questions: closedArgs.group_of_questions.questions.map((question) => ({
          ...question,
          status: "open",
        })),
      },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
  },
};
