import { addWeeks } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

import { PostSubscription, PostSubscriptionType } from "@/types/post";

/**
 * Default properties used when enabled subscription of the given type
 */
export const getDefaultSubscriptionProps = () =>
  ({
    [PostSubscriptionType.NEW_COMMENTS]: {
      comments_frequency: 1,
    },
    [PostSubscriptionType.STATUS_CHANGE]: {},
    [PostSubscriptionType.MILESTONE]: {
      milestone_step: 0.2,
    },
    [PostSubscriptionType.CP_CHANGE]: {
      cp_change_threshold: 0.25,
    },
    [PostSubscriptionType.SPECIFIC_TIME]: {
      subscriptions: [
        {
          type: PostSubscriptionType.SPECIFIC_TIME,
          next_trigger_datetime: formatInTimeZone(
            addWeeks(new Date(), 1),
            "UTC",
            "yyyy-MM-dd'T'HH:mm:ss'Z'"
          ),
          recurrence_interval: "",
        },
      ],
    },
  }) as const;

/**
 * Returns default Notebook subscription used when clicking "follow" button
 */
export const getInitialNotebookSubscriptions = (): PostSubscription[] => [
  {
    type: PostSubscriptionType.NEW_COMMENTS,
    ...getDefaultSubscriptionProps()[PostSubscriptionType.NEW_COMMENTS],
  },
];

/**
 * Returns default Question subscription used when clicking "follow" button
 */
export const getInitialQuestionSubscriptions = (): PostSubscription[] => [
  ...getInitialNotebookSubscriptions(),
  {
    type: PostSubscriptionType.STATUS_CHANGE,
    ...getDefaultSubscriptionProps()[PostSubscriptionType.STATUS_CHANGE],
  },
  {
    type: PostSubscriptionType.MILESTONE,
    ...getDefaultSubscriptionProps()[PostSubscriptionType.MILESTONE],
  },
  {
    type: PostSubscriptionType.CP_CHANGE,
    ...getDefaultSubscriptionProps()[PostSubscriptionType.CP_CHANGE],
  },
];
