import { Post, PostSubscriptionConfigItem } from "@/types/post";

type SubscriptionChangeHandler<
  T,
  K extends keyof T,
  I = never,
  IK extends keyof I = never,
> = (
  name: K | IK,
  value: T[K] | (I extends never ? never : I[IK]),
  index?: number
) => void;

export type SubscriptionSectionProps<
  T extends PostSubscriptionConfigItem,
  K extends keyof T,
  I = never,
  IK extends keyof I = never,
> = {
  subscription: T;
  onChange: SubscriptionChangeHandler<T, K, I, IK>;
  post: Post;
};
