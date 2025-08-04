import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import ConsumerPostCard from "@/components/consumer_post_card";
import PostCard from "@/components/post_card";
import { createConditionalRenderer } from "@/stories/utils/renderer/conditional-renderer";
import { stripUserPredictions } from "@/stories/utils/transforms/strip_user_predictions";
import {
  CpMovementState,
  withCpMovement,
} from "@/stories/utils/transforms/with_cp_movement";
import { PostWithForecasts } from "@/types/post";

import { getMockData } from "./mock_data";

const ongoingArgs = getMockData(false);
const closedArgs = getMockData(true);

type StoryProps = {
  post: PostWithForecasts;
  forCommunityFeed?: boolean;
  isConsumer?: boolean;
  hideUserPredictions?: boolean;
  cpMovement?: CpMovementState;
};

const meta = {
  title: "Feed Card/Continuous Question",
  component: PostCard,
  argTypes: {
    isConsumer: {
      control: { type: "boolean" },
    },
    hideUserPredictions: {
      control: { type: "boolean" },
      description: "Hide user predictions in graph cards",
    },
    cpMovement: {
      control: { type: "radio" },
      options: ["up", "down", "none"],
      description: "Toggle CP Movement (up, down, none)",
    },
    forCommunityFeed: {
      table: { disable: true },
    },
  },
} satisfies Meta<StoryProps>;

export default meta;

type Story = StoryObj<StoryProps>;

const render = createConditionalRenderer<StoryProps>({
  componentSelector: (args) => (args.isConsumer ? ConsumerPostCard : PostCard),
  transformRules: [
    {
      key: "cpMovement",
      when: () => true,
      transform: (args) => ({
        ...args,
        post: withCpMovement(args.post, args.cpMovement ?? "none"),
      }),
    },
    {
      key: "hideUserPredictions",
      when: (args) => !!args.hideUserPredictions,
      transform: (args) => ({
        ...args,
        post: stripUserPredictions(args.post),
      }),
    },
  ],
  buildKey: (args, appliedKeys) =>
    `${appliedKeys.join("-")}-${args.cpMovement ?? "none"}`,
});

export const Ongoing: Story = {
  render,
  args: {
    post: ongoingArgs as unknown as PostWithForecasts,
    isConsumer: false,
    hideUserPredictions: false,
    cpMovement: "none",
  },
};

export const CpHidden: Story = {
  render,
  args: {
    post: {
      ...ongoingArgs,
      nr_forecasters: 10,
      question: {
        ...ongoingArgs.question,
        cp_reveal_time: "2026-07-24T21:51:51Z",
        status: "open",
        resolution: null,
        aggregations: {
          recency_weighted: { history: [] },
        },
        my_forecasts: { history: [] },
      },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
    cpMovement: "none",
  },
};

export const Closed: Story = {
  render,
  args: {
    post: {
      ...closedArgs,
      resolved: false,
      question: {
        ...closedArgs.question,
        resolution: null,
        status: "closed",
      },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
    cpMovement: "none",
  },
};

export const Resolved: Story = {
  render,
  args: {
    post: {
      ...closedArgs,
      status: "resolved",
      question: { ...closedArgs.question },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
    cpMovement: "none",
  },
};
