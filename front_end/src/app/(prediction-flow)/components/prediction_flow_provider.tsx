"use client";

import { isNil } from "lodash";
import {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useState,
} from "react";

import { PredictionFlowPost } from "@/types/post";
import { isPostOpenQuestionPredicted } from "@/utils/forecasts/helpers";

import { isPostWithSignificantMovement, isPostStale } from "../helpers";

export enum FlowType {
  GENERAL = "general",
  NOT_PREDICTED = "not-predicted",
  MOVEMENT = "movement",
  STALE = "stale",
}

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
  initialPosts: PredictionFlowPost[];
  flowType?: FlowType;
};

const PredictionFlowProvider: FC<
  PropsWithChildren<PredictionFlowProviderProps>
> = ({ children, initialPosts, flowType }) => {
  const flowTypePosts = getFlowTypePosts(initialPosts, flowType);
  const [posts, setPosts] = useState<PredictionFlowPost[]>(
    flowTypePosts.map((post) => ({
      ...post,
      isDone: isNil(flowType) ? isPostOpenQuestionPredicted(post) : false,
    }))
  );
  const [currentPostId, setCurrentPostId] = useState<number | null>(
    flowTypePosts[0]?.id ?? null
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

function getFlowTypePosts(
  posts: PredictionFlowPost[],
  flowType?: FlowType
): PredictionFlowPost[] {
  switch (flowType) {
    case FlowType.GENERAL:
      return posts.filter(
        (post) =>
          !isPostOpenQuestionPredicted(post) ||
          isPostStale(post) ||
          isPostWithSignificantMovement(post)
      );
    case FlowType.NOT_PREDICTED:
      return posts.filter((post) => !isPostOpenQuestionPredicted(post));
    case FlowType.MOVEMENT:
      return posts.filter((post) => isPostWithSignificantMovement(post));
    case FlowType.STALE:
      return posts.filter((post) => isPostStale(post));
    default:
      return posts;
  }
}

export default PredictionFlowProvider;
