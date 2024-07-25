import { PostSubscription, PostSubscriptionType } from "@/types/post";

export const getDefaultSubscriptions = (): PostSubscription[] => [
  {
    type: PostSubscriptionType.NEW_COMMENTS,
    // TODO: check with Sylvain
    comments_frequency: 10,
  },
  {
    type: PostSubscriptionType.STATUS_CHANGE,
  },
  {
    type: PostSubscriptionType.MILESTONE,
    milestone_step: 0.2,
  },
];
