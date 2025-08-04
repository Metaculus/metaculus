import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import CommentsFeedProvider from "@/app/(main)/components/comments_feed_provider";
import ConsumerQuestionView from "@/app/(main)/questions/[id]/components/question_view/consumer_question_view";
import ForecasterQuestionView from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view";
import { PostSubscriptionProvider } from "@/contexts/post_subscription_context";
import { getMockData as getDateQuestionMockData } from "@/stories/feed_card/date_question/mock_data";
import { createConditionalRenderer } from "@/stories/utils/renderer/conditional-renderer";
import { stripUserPredictions } from "@/stories/utils/transforms/strip_user_predictions";
import { PostWithForecasts } from "@/types/post";

const ongoingArgs = getDateQuestionMockData(false);
const closedArgs = getDateQuestionMockData(true);

type StoryProps = {
  postData: PostWithForecasts;
  isConsumer?: boolean;
  hideUserPredictions?: boolean;
  preselectedGroupQuestionId?: number;
};

const meta = {
  title: "Question Page/Date Question",
  component: ForecasterQuestionView,
  argTypes: {
    isConsumer: { control: { type: "boolean" } },
    hideUserPredictions: {
      control: { type: "boolean" },
      description: "Hide user predictions in graph cards",
    },
    preselectedGroupQuestionId: { control: { type: "number" } },
    postData: { control: { type: "object" } },
  },
  decorators: [
    (Story, context) => {
      const { postData } = context.args;
      return (
        <PostSubscriptionProvider post={postData}>
          <CommentsFeedProvider postData={postData} rootCommentStructure={true}>
            <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
              <Story />
            </div>
          </CommentsFeedProvider>
        </PostSubscriptionProvider>
      );
    },
  ],
} satisfies Meta<StoryProps>;

export default meta;

type Story = StoryObj<StoryProps>;

const render = createConditionalRenderer<StoryProps>({
  componentSelector: (args) =>
    args.isConsumer ? ConsumerQuestionView : ForecasterQuestionView,
  transformRules: [
    {
      key: "hideUserPredictions",
      when: (args) => args.hideUserPredictions === true,
      transform: (args) => ({
        ...args,
        postData: stripUserPredictions(args.postData),
      }),
    },
  ],
  buildKey: (_, appliedKeys) => `${appliedKeys.join("-")}`,
});

export const Ongoing: Story = {
  render,
  args: {
    postData: ongoingArgs as unknown as PostWithForecasts,
    isConsumer: false,
    hideUserPredictions: false,
  },
};

export const CpHidden: Story = {
  render,
  args: {
    postData: {
      ...ongoingArgs,
      question: {
        ...ongoingArgs.question,
        cp_reveal_time: "2026-07-24T21:51:51Z",
        status: "open",
        resolution: null,
        aggregations: { recency_weighted: { history: [] } },
        my_forecasts: { history: [] },
      },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
  },
};

export const Closed: Story = {
  render,
  args: {
    postData: {
      ...closedArgs,
      question: {
        ...closedArgs.question,
        resolution: null,
      },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
  },
};

export const Resolved: Story = {
  render,
  args: {
    postData: {
      ...closedArgs,
      status: "resolved",
      question: {
        ...closedArgs.question,
        status: "resolved",
      },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
  },
};
