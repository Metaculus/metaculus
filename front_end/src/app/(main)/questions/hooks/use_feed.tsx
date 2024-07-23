import { useCallback, useMemo } from "react";

import {
  FeedType,
  POST_FORECASTER_ID_FILTER,
  POST_ORDER_BY_FILTER,
  POST_STATUS_FILTER,
  POST_TOPIC_FILTER,
  POST_USERNAMES_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { PostStatus } from "@/types/post";
import { QuestionOrder } from "@/types/question";

const useFeed = () => {
  const { params, setParam, deleteParam } = useSearchParams();
  const { user } = useAuth();

  const selectedTopic = params.get(POST_TOPIC_FILTER);
  const guessedById = params.get(POST_FORECASTER_ID_FILTER);
  const authorUsernames = params.getAll(POST_USERNAMES_FILTER);
  const orderBy = params.get(POST_ORDER_BY_FILTER);
  const postStatus = params.get(POST_STATUS_FILTER);

  const currentFeed = useMemo(() => {
    if (selectedTopic) return null;
    if (guessedById) return FeedType.MY_PREDICTIONS;
    if (postStatus === PostStatus.PENDING) return FeedType.IN_REVIEW;

    if (
      user &&
      authorUsernames.length &&
      authorUsernames[0] === user.username
    ) {
      return FeedType.MY_QUESTIONS_AND_POSTS;
    }

    return FeedType.HOME;
  }, [authorUsernames, guessedById, postStatus, selectedTopic, user]);

  // TODO: cleanup status when BE supports pending status
  const clearInReview = useCallback(() => {
    if (orderBy === QuestionOrder.VotesDesc) {
      deleteParam(POST_ORDER_BY_FILTER, false);
    }
  }, [deleteParam, orderBy]);

  const switchFeed = useCallback(
    (feedType: FeedType) => {
      clearInReview();

      // If switching from another feed
      if (currentFeed) {
        for (let p of Array.from(params)) {
          deleteParam(p[0]);
        }
      } else {
        // If switching from category
        deleteParam(POST_TOPIC_FILTER);
      }

      if (feedType === FeedType.MY_PREDICTIONS) {
        if (user) {
          setParam(POST_FORECASTER_ID_FILTER, user.id.toString());
          setParam(POST_ORDER_BY_FILTER, QuestionOrder.WeeklyMovementDesc);
        }
      }
      if (feedType === FeedType.MY_QUESTIONS_AND_POSTS) {
        user && setParam(POST_USERNAMES_FILTER, user.username.toString());
      }
      if (feedType === FeedType.IN_REVIEW) {
        user && setParam(POST_STATUS_FILTER, PostStatus.PENDING);
      }
    },
    [currentFeed, clearInReview, deleteParam, params, setParam, user]
  );

  return {
    currentFeed,
    clearInReview,
    switchFeed,
  };
};

export default useFeed;
