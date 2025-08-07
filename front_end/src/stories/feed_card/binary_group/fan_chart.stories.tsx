import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import ConsumerPostCard from "@/components/consumer_post_card";
import PostCard from "@/components/post_card";
import { AuthContext } from "@/contexts/auth_context";
import { createConditionalRenderer } from "@/stories/utils/renderer/conditional-renderer";
import { stripUserPredictions } from "@/stories/utils/transforms/strip_user_predictions";
import { PostWithForecasts } from "@/types/post";
import { CurrentUser } from "@/types/users";

import { getMockData } from "./mock_data";

const ongoingArgs = getMockData(false, true);
const closedArgs = getMockData(true, true);

type StoryProps = {
  post: PostWithForecasts;
  forCommunityFeed?: boolean;
  isConsumer?: boolean;
  hideUserPredictions?: boolean;
};

const meta = {
  title: "Feed Card/Binary Group/Fan Chart",
  component: PostCard,
  argTypes: {
    isConsumer: {
      control: {
        type: "boolean",
        order: 0,
      },
    },
    hideUserPredictions: {
      control: { type: "boolean" },
      description: "Hide user predictions in graph cards",
    },
    post: {
      control: {
        type: "object",
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

const render = createConditionalRenderer<StoryProps>({
  componentSelector: (args) => (args.isConsumer ? ConsumerPostCard : PostCard),
  transformRules: [
    {
      key: "hideUserPredictions",
      when: (args) => !!args.hideUserPredictions,
      transform: (args) => ({
        ...args,
        post: stripUserPredictions(args.post),
      }),
    },
  ],
  buildKey: (_args, appliedKeys) =>
    appliedKeys.length > 0 ? appliedKeys.join("-") : "default",
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
          aggregations: {
            recency_weighted: {
              history: [],
            },
          },
          my_forecasts: {
            history: [],
          },
        })),
      },
    } as unknown as PostWithForecasts,
    hideUserPredictions: false,
  },
  decorators: [
    (Story) => (
      <AuthContext.Provider
        value={{
          user: { hide_community_prediction: true } as CurrentUser,
          setUser: () => {},
        }}
      >
        <Story />
      </AuthContext.Provider>
    ),
  ],
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
