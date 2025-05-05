"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { PostWithForecasts } from "@/types/post";
import { isPostPredicted } from "@/utils/forecasts/helpers";

export enum FlowType {
  GENERAL = "general",
  NOT_PREDICTED = "not-predicted",
  MOVEMENT = "movement",
  STALE = "stale",
}
type PredictionFlowPost = PostWithForecasts & {
  isDone?: boolean;
};

type PredictionFlowContextType = {
  posts: PredictionFlowPost[];
  setPosts: (posts: PredictionFlowPost[]) => void;
  currentPostId: number | null;
  flowType?: FlowType;
  setCurrentPostId: (postId: number | null) => void;
  isPending: boolean;
  setIsPending: (isPending: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (isMenuOpen: boolean) => void;
};

export const PredictionFlowContext =
  createContext<PredictionFlowContextType | null>(null);

type PredictionFlowProviderProps = {
  initialPosts: PostWithForecasts[];
  flowType?: FlowType;
};

const PredictionFlowProvider: FC<
  PropsWithChildren<PredictionFlowProviderProps>
> = ({ children, initialPosts, flowType }) => {
  const [posts, setPosts] = useState<PredictionFlowPost[]>(
    initialPosts.map((post) => ({ ...post, isDone: isPostPredicted(post) }))
  );
  const [currentPostId, setCurrentPostId] = useState<number | null>(
    initialPosts[0]?.id ?? null
  );
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

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
        isMenuOpen,
        setIsMenuOpen,
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
