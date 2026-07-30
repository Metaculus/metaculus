import type { ForecastPayload } from "@/services/api/questions/questions.server";
import { PostSubscription } from "@/types/post";

export type GatedActionTrigger = "post_vote" | "post_subscribe" | "forecast";

export type GatedActionInput =
  | { type: "post_vote"; payload: { post: number; direction: 1 | -1 } }
  | {
      type: "post_subscribe";
      payload: { post: number; subscriptions: PostSubscription[] };
    }
  | { type: "forecast"; payload: ForecastPayload[] };

export type EmailCapturePendingRecord = {
  email: string;
  sentAt: number;
  trigger: GatedActionTrigger;
  surface?: string;
  gatedAction: GatedActionInput | null;
  redirectUrl: string;
};

export type SocialGatedActionStash = {
  gatedAction: GatedActionInput;
  trigger: GatedActionTrigger;
  stashedAt: number;
};
