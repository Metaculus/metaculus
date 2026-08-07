import type { ForecastPayload } from "@/services/api/questions/questions.server";
import { PostSubscription } from "@/types/post";

export type GatedActionTrigger = "post_vote" | "post_subscribe" | "forecast";

// What opened the capture flow. "sign_in" is the login/signup modal entry
// point: it carries no gated action of its own, so it is not a
// GatedActionTrigger, but it drives the same drawer.
export type CaptureTrigger = GatedActionTrigger | "sign_in";

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
  trigger: CaptureTrigger;
  surface?: string;
  gatedAction: GatedActionInput | null;
  redirectUrl: string;
};

export type SocialGatedActionStash = {
  gatedAction: GatedActionInput;
  trigger: CaptureTrigger;
  stashedAt: number;
};
