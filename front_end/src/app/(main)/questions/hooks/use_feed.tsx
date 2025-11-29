import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

import {
  FeedType,
  POST_COMMUNITIES_FILTER,
  POST_FOLLOWING_FILTER,
  POST_FOR_MAIN_FEED,
  POST_FORECASTER_ID_FILTER,
  POST_ORDER_BY_FILTER,
  POST_STATUS_FILTER,
  POST_TOPIC_FILTER,
  POST_USERNAMES_FILTER,
  POST_WEEKLY_TOP_COMMENTS_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { QuestionOrder } from "@/types/question";

const useFeed = () => {
  const { params, setParam, deleteParam } = useSearchParams();
  const { user } = useAuth();
  const pathname = usePathname();

  const selectedTopic = params.get(POST_TOPIC_FILTER);
  const guessedById = params.get(POST_FORECASTER_ID_FILTER);
  const authorUsernames = params.getAll(POST_USERNAMES_FILTER);
  const following = params.get(POST_FOLLOWING_FILTER);
  const orderBy = params.get(POST_ORDER_BY_FILTER);
  const communities = params.get(POST_COMMUNITIES_FILTER);
  const weeklyTopComments = params.get(POST_WEEKLY_TOP_COMMENTS_FILTER);

  const currentFeed = useMemo(() => {
    if (selectedTopic) return null;
    if (guessedById) return FeedType.MY_PREDICTIONS;
    if (following) return FeedType.FOLLOWING;

    if (
      user &&
      authorUsernames.length &&
      authorUsernames[0] === user.username
    ) {
      return FeedType.MY_QUESTIONS_AND_POSTS;
    }
    if (communities) {
      return FeedType.COMMUNITIES;
    }
    if (weeklyTopComments) {
      return FeedType.WEEKLY_TOP_COMMENTS;
    }
    return FeedType.HOME;
  }, [
    selectedTopic,
    guessedById,
    following,
    authorUsernames,
    communities,
    user,
    weeklyTopComments,
  ]);

  const clearInReview = useCallback(() => {
    if (orderBy === QuestionOrder.VotesDesc) {
      deleteParam(POST_ORDER_BY_FILTER, false);
    }
  }, [deleteParam, orderBy]);

  const getParamsForFeed = useCallback(
    (feed: FeedType): Record<string, string> => {
      switch (feed) {
        case FeedType.MY_PREDICTIONS:
          if (!user) return {};
          return {
            [POST_FOR_MAIN_FEED]: "false",
            [POST_FORECASTER_ID_FILTER]: user.id.toString(),
            [POST_ORDER_BY_FILTER]: QuestionOrder.WeeklyMovementDesc,
            [POST_STATUS_FILTER]: "open",
          };
        case FeedType.MY_QUESTIONS_AND_POSTS:
          if (!user) return {};
          return {
            [POST_FOR_MAIN_FEED]: "false",
            [POST_USERNAMES_FILTER]: user.username,
          };
        case FeedType.COMMUNITIES:
          return { [POST_COMMUNITIES_FILTER]: "true" };
        case FeedType.WEEKLY_TOP_COMMENTS:
          return { [POST_WEEKLY_TOP_COMMENTS_FILTER]: "true" };
        case FeedType.FOLLOWING:
          return { [POST_FOLLOWING_FILTER]: "true" };
        case FeedType.HOME:
        default:
          return {};
      }
    },
    [user]
  );

  const getFeedUrl = useCallback(
    (feed: FeedType): string => {
      const p = getParamsForFeed(feed);
      const qs = new URLSearchParams(p).toString();
      return `${pathname}${qs ? `?${qs}` : ""}`;
    },
    [getParamsForFeed, pathname]
  );

  const switchFeed = useCallback(
    (feed: FeedType) => {
      clearInReview();

      // If switching from another feed
      if (currentFeed) {
        for (const [key] of Array.from(params)) {
          deleteParam(key);
        }
      } else {
        // coming from a topic filter
        deleteParam(POST_TOPIC_FILTER);
      }

      // set only the params needed for the new feed
      const nextParams = getParamsForFeed(feed);
      Object.entries(nextParams).forEach(([key, value]) => {
        setParam(key, value);
      });
    },
    [
      currentFeed,
      params,
      clearInReview,
      deleteParam,
      setParam,
      getParamsForFeed,
    ]
  );

  return {
    currentFeed,
    clearInReview,
    getFeedUrl,
    switchFeed,
  };
};

export default useFeed;
