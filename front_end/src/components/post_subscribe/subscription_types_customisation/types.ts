import { Post, PostSubscriptionModal } from "@/types/post";

export type SubscriptionSectionProps<T extends PostSubscriptionModal> = {
  subscription: T;
  onChange: <K extends keyof T>(
    name: string,
    value: any,
    index?: number
  ) => void;
  post: Post;
};
