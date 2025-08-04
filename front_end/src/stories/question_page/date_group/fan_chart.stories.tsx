import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import ConsumerQuestionView from "@/app/(main)/questions/[id]/components/question_view/consumer_question_view";
import ForecasterQuestionView from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view";
import { PostSubscriptionProvider } from "@/contexts/post_subscription_context";
import { getMockData as getDateGroupMockData } from "@/stories/feed_card/date_group/mock_data";
import { createConditionalRenderer } from "@/stories/utils/renderer/conditional-renderer";
import { stripUserPredictions } from "@/stories/utils/transforms/strip_user_predictions";
import { PostWithForecasts } from "@/types/post";

const ongoingArgs = getDateGroupMockData(false, true);
const closedArgs = getDateGroupMockData(true, true);

type StoryProps = {
  postData: PostWithForecasts;
  isConsumer?: boolean;
  hideUserPredictions?: boolean;
  preselectedGroupQuestionId?: number;
};

const meta = {
  title: "Question Page/Date Group/Fan Chart",
  component: ForecasterQuestionView,
  argTypes: {
    isConsumer: { control: { type: "boolean", order: 0 } },
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
          <div style={{ maxWidth: "1024px", margin: "0 auto" }}>
            <Story />
          </div>
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
});

export const Ongoing: Story = {
  render,
  args: {
    postData: {
      ...ongoingArgs,
      group_of_questions: {
        ...ongoingArgs.group_of_questions,
        questions: ongoingArgs.group_of_questions.questions.map((q) => ({
          ...q,
          status: "open",
          resolution: null,
          cp_reveal_time: null,
          actual_resolve_time: null,
          actual_close_time: null,
          aggregations: { recency_weighted: { history: [] } },
          my_forecasts: { history: [] },
        })),
      },
    } as unknown as PostWithForecasts,
    isConsumer: false,
    hideUserPredictions: false,
  },
};

export const CpHidden: Story = {
  render,
  args: {
    postData: {
      ...ongoingArgs,
      group_of_questions: {
        ...ongoingArgs.group_of_questions,
        questions: ongoingArgs.group_of_questions.questions.map((q) => ({
          ...q,
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
    postData: {
      ...ongoingArgs,
      status: "closed",
      group_of_questions: {
        ...ongoingArgs.group_of_questions,
        questions: ongoingArgs.group_of_questions.questions.map((q) => ({
          ...q,
          status: "open",
          actual_resolve_time: q.actual_resolve_time,
          actual_close_time: q.actual_close_time,
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
    postData: {
      ...closedArgs,
      status: "resolved",
      group_of_questions: {
        ...closedArgs.group_of_questions,
        questions: closedArgs.group_of_questions.questions.map((q) => ({
          ...q,
          status: "resolved",
          resolution: q.resolution ?? "annulled",
        })),
      },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
  },
};
