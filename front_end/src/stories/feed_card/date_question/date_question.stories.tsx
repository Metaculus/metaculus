import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import ConsumerPostCard from "@/components/consumer_post_card";
import PostCard from "@/components/post_card";
import { PostWithForecasts } from "@/types/post";

import { getMockData } from "./mock_data";

const ongoingArgs = getMockData(false);
const closedArgs = getMockData(true);

type StoryProps = {
  post: PostWithForecasts;
  forCommunityFeed?: boolean;
  isConsumer?: boolean;
};

const meta = {
  title: "Feed Card/Date Question",
  component: PostCard,
  argTypes: {
    isConsumer: {
      control: {
        type: "boolean",
      },
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

export const Ongoing: Story = {
  render: (args) => {
    return args.isConsumer ? (
      <ConsumerPostCard {...args} />
    ) : (
      <PostCard {...args} />
    );
  },
  args: {
    post: ongoingArgs as unknown as PostWithForecasts,
    isConsumer: false,
  },
};

export const CpHidden: Story = {
  render: (args) => {
    return args.isConsumer ? (
      <ConsumerPostCard {...args} />
    ) : (
      <PostCard {...args} />
    );
  },
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
          recency_weighted: {
            history: [],
          },
        },
        my_forecasts: {
          history: [],
        },
      },
    } as unknown as PostWithForecasts,
  },
};

export const Closed: Story = {
  render: (args) => {
    return args.isConsumer ? (
      <ConsumerPostCard {...args} />
    ) : (
      <PostCard {...args} />
    );
  },
  args: {
    post: {
      ...closedArgs,
      question: {
        ...closedArgs.question,
        resolution: null,
      },
    } as unknown as PostWithForecasts,
  },
};

export const Resolved: Story = {
  render: (args) => {
    return args.isConsumer ? (
      <ConsumerPostCard {...args} />
    ) : (
      <PostCard {...args} />
    );
  },
  args: {
    post: {
      ...closedArgs,
      status: "resolved",
      question: {
        ...closedArgs.question,
        status: "resolved",
      },
    } as unknown as PostWithForecasts,
  },
};
