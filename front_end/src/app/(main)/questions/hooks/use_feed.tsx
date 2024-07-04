import { useCallback, useMemo } from "react";

import {
  FeedType,
  POST_FORECASTED_ID_FILTER,
  POST_ORDER_BY_FILTER,
  POST_TOPIC_FILTER,
  POST_USERNAMES_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { QuestionOrder } from "@/types/question";

const useFeed = () => {
  const { params, setParam, deleteParam } = useSearchParams();
  const { user } = useAuth();

  const selectedTopic = params.get(POST_TOPIC_FILTER);
  const forecastedId = params.get(POST_FORECASTED_ID_FILTER);
  const authorUsernames = params.getAll(POST_USERNAMES_FILTER);
  const orderBy = params.get(POST_ORDER_BY_FILTER);

  const currentFeed = useMemo(() => {
    if (selectedTopic) return null;
    if (forecastedId) return FeedType.MY_PREDICTIONS;

    if (
      user &&
      authorUsernames.length &&
      authorUsernames[0] === user.username
    ) {
      return FeedType.MY_QUESTIONS_AND_POSTS;
    }

    return FeedType.HOME;
  }, [authorUsernames, forecastedId, selectedTopic, user]);

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
        user && setParam(POST_FORECASTED_ID_FILTER, user.id.toString());
      }
      if (feedType === FeedType.MY_QUESTIONS_AND_POSTS) {
        user && setParam(POST_USERNAMES_FILTER, user.username.toString());
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
