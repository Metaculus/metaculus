import { Post, PostSubscriptionConfigItem } from "@/types/post";

export type SubscriptionSectionProps<T extends PostSubscriptionConfigItem> = {
  subscription: T;
  onChange: <K extends keyof T>(
    name: string,
    value: any,
    index?: number
  ) => void;
  post: Post;
};
