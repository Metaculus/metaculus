import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import ConsumerQuestionView from "@/app/(main)/questions/[id]/components/question_view/consumer_question_view";
import ForecasterQuestionView from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view";
import { PostSubscriptionProvider } from "@/contexts/post_subscription_context";
import { getMockData as getBinaryQuestionMockData } from "@/stories/feed_card/binary_question/mock_data";
import { createConditionalRenderer } from "@/stories/utils/renderer/conditional-renderer";
import { stripUserPredictions } from "@/stories/utils/transforms/strip_user_predictions";
import {
  CpMovementState,
  withCpMovement,
} from "@/stories/utils/transforms/with_cp_movement";
import { PostWithForecasts } from "@/types/post";

const ongoingArgs = getBinaryQuestionMockData(false);
const closedArgs = getBinaryQuestionMockData(true);

type StoryProps = {
  postData: PostWithForecasts;
  isConsumer?: boolean;
  hideUserPredictions?: boolean;
  preselectedGroupQuestionId?: number;
  cpMovement?: CpMovementState;
};

const meta = {
  title: "Question Page/Binary Question",
  component: ForecasterQuestionView,
  argTypes: {
    isConsumer: { control: { type: "boolean" } },
    hideUserPredictions: {
      control: { type: "boolean" },
      description: "Hide user predictions in graph cards",
    },
    cpMovement: {
      control: { type: "radio" },
      options: ["up", "down", "none"],
      description: "Toggle CP Movement (up, down, none)",
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
      key: "cpMovement",
      when: (args) => args.cpMovement !== undefined,
      transform: (args) => ({
        ...args,
        postData: withCpMovement(args.postData, args.cpMovement ?? "none"),
      }),
    },
    {
      key: "hideUserPredictions",
      when: (args) => !!args.hideUserPredictions,
      transform: (args) => ({
        ...args,
        postData: stripUserPredictions(args.postData),
      }),
    },
  ],
  buildKey: (args, appliedKeys) =>
    `${appliedKeys.join("-")}-${args.cpMovement ?? "none"}`,
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
