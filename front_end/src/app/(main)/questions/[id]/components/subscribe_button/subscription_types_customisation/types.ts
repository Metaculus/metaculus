import { PostSubscription, PostSubscriptionType } from "@/types/post";

export type SubscriptionSectionProps<T extends PostSubscription> = {
  subscription: T;
  onChange: <K extends keyof T>(name: K, value: T[K]) => void;
};
