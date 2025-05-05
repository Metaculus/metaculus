"use client";

import { isNil } from "lodash";
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
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
  currentPostId: number | null;
  flowType?: FlowType;
  isPending: boolean;
  setIsPending: (isPending: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (isMenuOpen: boolean) => void;
  postsLeft: number;
  changeActivePost: (
    postId: number | null,
    shouldCheckPredictedQuestions?: boolean
  ) => void;
  handlePostPredictionSubmit: (
    currentPost: PredictionFlowPost | undefined
  ) => void;
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
      // for all tournament questions flow we set this field to true after user saw (skipped) or predicted the question
      // for require attention flow we set this field to true after user predicted or reaffirmed the prediction
      isDone: false,
    }))
  );
  const [currentPostId, setCurrentPostId] = useState<number | null>(
    flowTypePosts[0]?.id ?? null
  );
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const postsLeft = useMemo(() => {
    return posts.filter((post) => !post.isDone).length;
  }, [posts]);

  const changeActivePost = useCallback(
    (postId: number | null, shouldCheckPredictedQuestions = false) => {
      if (isNil(flowType)) {
        setPosts(
          posts.map((post) => {
            if (post.id === currentPostId) {
              // update counter of questions left in ALL tournament questions flow
              return {
                ...post,
                isDone: shouldCheckPredictedQuestions
                  ? isPostOpenQuestionPredicted(post, {
                      checkAllSubquestions: true,
                    })
                  : true,
              };
            }
            return post;
          })
        );
      }
      setCurrentPostId(postId);
    },
    [currentPostId, flowType, posts]
  );

  const handlePostPredictionSubmit = useCallback(
    (currentPost: PredictionFlowPost | undefined) => {
      if (currentPost) {
        setPosts(
          posts.map((prevPost) => {
            return prevPost?.id === currentPost.id
              ? {
                  ...currentPost,
                  // update counter of questions left and color of the step button
                  isDone: isPostOpenQuestionPredicted(currentPost, {
                    checkAllSubquestions: true,
                  }),
                }
              : prevPost;
          })
        );
      }
    },
    [posts]
  );

  return (
    <PredictionFlowContext.Provider
      value={{
        posts,
        currentPostId,
        flowType,
        isPending,
        setIsPending,
        isMenuOpen,
        setIsMenuOpen,
        postsLeft,
        changeActivePost,
        handlePostPredictionSubmit,
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
