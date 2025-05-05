"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { PostWithForecasts } from "@/types/post";

export type FlowType = "general" | "not-predicted" | "movement" | "stale";
type PredictionFlowPost = PostWithForecasts & {
  isDone?: boolean;
};

type PredictionFlowContextType = {
  posts: PredictionFlowPost[];
  setPosts: (posts: PredictionFlowPost[]) => void;
  currentPostId: number;
  flowType: FlowType;
  setCurrentPostId: (postId: number) => void;
  isPending: boolean;
  setIsPending: (isPending: boolean) => void;
};

export const PredictionFlowContext =
  createContext<PredictionFlowContextType | null>(null);

type PredictionFlowProviderProps = {
  initialPosts: PostWithForecasts[];
  flowType: FlowType;
};

const PredictionFlowProvider: FC<
  PropsWithChildren<PredictionFlowProviderProps>
> = ({ children, initialPosts, flowType }) => {
  const [posts, setPosts] = useState<PredictionFlowPost[]>(initialPosts);
  const [currentPostId, setCurrentPostId] = useState<number>(
    initialPosts[0]?.id ?? 0
  );
  const [isPending, setIsPending] = useState<boolean>(false);
  return (
    <PredictionFlowContext.Provider
      value={{
        posts,
        setPosts,
        currentPostId,
        flowType,
        setCurrentPostId,
        isPending,
        setIsPending,
      }}
    >
      {children}
    </PredictionFlowContext.Provider>
  );
};

export const usePredictionFlow = () => {
  const context = useContext(PredictionFlowContext);
  if (!context) {
    throw new Error(
      "usePredictionFlow must be used within a PredictionFlowProvider"
    );
  }

  return context;
};

export default PredictionFlowProvider;
