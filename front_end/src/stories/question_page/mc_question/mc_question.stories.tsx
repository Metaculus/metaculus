import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CoherenceLinksProvider } from "@/app/(main)/components/coherence_links_provider";
import { QuestionLayoutProvider } from "@/app/(main)/questions/[id]/components/question_layout/question_layout_context";
import {
  ConsumerShell,
  ForecasterShell,
} from "@/app/(main)/questions/[id]/components/question_page_shell";
import { PostSubscriptionProvider } from "@/contexts/post_subscription_context";
import { getMockData as getMultipleChoiceMockData } from "@/stories/feed_card/mc_question/mock_data";
import { MockCommentsFeedProvider } from "@/stories/utils/mocks/mock_comments_feed_provider";
import MockHideCPProvider from "@/stories/utils/mocks/mock_hide_cp_provider";
import { createConditionalRenderer } from "@/stories/utils/renderer/conditional-renderer";
import { stripUserPredictions } from "@/stories/utils/transforms/strip_user_predictions";
import { PostWithForecasts } from "@/types/post";

const ongoingArgs = getMultipleChoiceMockData(false);
const closedArgs = getMultipleChoiceMockData(true);

type StoryProps = {
  postData: PostWithForecasts;
  isConsumer?: boolean;
  hideUserPredictions?: boolean;
};

const meta = {
  title: "Question Page/Multiple Choice Question",
  component: ForecasterShell,
  argTypes: {
    isConsumer: { control: { type: "boolean" } },
    hideUserPredictions: {
      control: { type: "boolean" },
      description: "Hide user predictions in graph cards",
    },
    postData: { control: { type: "object" } },
  },
  decorators: [
    (Story, context) => {
      const { postData } = context.args;
      return (
        <PostSubscriptionProvider post={postData}>
          <CoherenceLinksProvider post={postData}>
            <MockCommentsFeedProvider>
              <div style={{ maxWidth: "703px", margin: "0 auto" }}>
                <QuestionLayoutProvider>
                  <Story />
                </QuestionLayoutProvider>
              </div>
            </MockCommentsFeedProvider>
          </CoherenceLinksProvider>
        </PostSubscriptionProvider>
      );
    },
  ],
} satisfies Meta<StoryProps>;

export default meta;

type Story = StoryObj<StoryProps>;

const render = createConditionalRenderer<StoryProps>({
  componentSelector: (args) =>
    args.isConsumer ? ConsumerShell : ForecasterShell,
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
      nr_forecasters: 10,
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
  decorators: [
    (Story) => (
      <MockHideCPProvider>
        <Story />
      </MockHideCPProvider>
    ),
  ],
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
      question: {
        ...closedArgs.question,
        status: "resolved",
      },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
  },
};
