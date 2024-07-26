import { addWeeks } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { PostSubscription, PostSubscriptionType } from "@/types/post";

/**
 * Default properties used when enabled subscription of the given type
 */
export const getDefaultSubscriptionProps = () =>
  ({
    [PostSubscriptionType.NEW_COMMENTS]: {
      comments_frequency: 10,
    },
    // TODO: enable this implicitly!!!
    [PostSubscriptionType.STATUS_CHANGE]: {},
    [PostSubscriptionType.MILESTONE]: {
      milestone_step: 0.2,
    },
    [PostSubscriptionType.CP_CHANGE]: {},
    [PostSubscriptionType.SPECIFIC_TIME]: {
      next_trigger_datetime: formatInTimeZone(
        addWeeks(new Date(), 1),
        "UTC",
        "yyyy-MM-dd'T'HH:mm:ss'Z'"
      ),
      recurrence_interval: "",
    },
  }) as const;

/**
 * Returns default subscription used when clicking "follow" button
 */
export const getInitialSubscriptions = (): PostSubscription[] => [
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
