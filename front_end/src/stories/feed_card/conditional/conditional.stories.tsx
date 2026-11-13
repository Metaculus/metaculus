import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import EmbedScreen from "@/app/(embed)/questions/components/embed_screen";
import ConsumerPostCard from "@/components/consumer_post_card";
import PostCard from "@/components/post_card";
import { PostWithForecasts } from "@/types/post";

import { conditionalPosts } from "./mock_data";

type StoryProps = {
  post: PostWithForecasts;
  isConsumer?: boolean;
};

const meta = {
  title: "Feed Card/Conditional",
  args: { post: conditionalPosts.openBinary, isConsumer: true },
  argTypes: { isConsumer: { control: { type: "boolean" } } },
  render: ({ post, isConsumer }) => {
    const Card = isConsumer ? ConsumerPostCard : PostCard;
    return (
      <div className="max-w-[340px]">
        <Card post={post} forFeedPage useShortTitle />
      </div>
    );
  },
} satisfies Meta<StoryProps>;

export default meta;

type Story = StoryObj<StoryProps>;

export const OpenBinary: Story = {};
export const OpenNumeric: Story = {
  args: { post: conditionalPosts.openNumeric },
};
export const ClosedConditionResolvedYes: Story = {
  args: { post: conditionalPosts.closedConditionYes },
};
export const ResolvedNumeric: Story = {
  args: { post: conditionalPosts.resolvedNumeric },
};
export const ResolvedConditionNo: Story = {
  args: { post: conditionalPosts.resolvedConditionNo },
};
export const ResolvedDate: Story = {
  args: { post: conditionalPosts.resolvedDate },
};

export const FeedGrid: Story = {
  render: ({ isConsumer }) => {
    const Card = isConsumer ? ConsumerPostCard : PostCard;
    return (
      <div className="grid max-w-[1040px] grid-cols-3 items-start gap-3">
        {Object.entries(conditionalPosts).map(([key, post]) => (
          <Card key={key} post={post} forFeedPage useShortTitle />
        ))}
      </div>
    );
  },
};

export const Embed: Story = {
  render: ({ post }) => (
    <EmbedScreen post={post} customWidth={550} customHeight={360} />
  ),
};
