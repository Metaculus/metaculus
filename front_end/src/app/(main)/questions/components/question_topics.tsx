"use client";
import {
  faArrowUp,
  faEllipsis,
  faFileClipboard,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { use } from "ast-types";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import Button from "@/components/ui/button";
import {
  FeedType,
  POST_AUTHOR_FILTER,
  POST_FORECASTED_ID_FILTER,
  POST_ORDER_BY_FILTER,
  POST_TOPIC_FILTER,
  POST_USERNAMES_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";
import { Topic } from "@/types/projects";
import { QuestionOrder } from "@/types/question";

import TopicItem from "./topic_item";

const EXPAND_THRESHOLD = 2;

const Title: FC<{ title: string }> = ({ title }) => (
  <div className="mt-1 hidden pl-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-500-dark sm:block">
    {title}
  </div>
);

type Props = {
  topics: Topic[];
};

const QuestionTopics: FC<Props> = ({ topics }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { params, setParam, deleteParam } = useSearchParams();

  const selectedTopic = params.get(POST_TOPIC_FILTER);
  const forecastedId = params.get(POST_FORECASTED_ID_FILTER);
  const authorUsernames = params.getAll(POST_USERNAMES_FILTER);
  const orderBy = params.get(POST_ORDER_BY_FILTER);

  const { hotTopics, hotCategories } = useMemo(
    () => ({
      hotTopics: topics.filter((t) => t.section === "hot_topics"),
      hotCategories: topics.filter((t) => t.section === "hot_categories"),
    }),
    [topics]
  );

  const isMobileExpandable =
    hotTopics.length + hotCategories.length > EXPAND_THRESHOLD;
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const currentFeed = useMemo(() => {
    if (selectedTopic) return null;

    if (forecastedId) return FeedType.MY_PREDICTIONS;
    if (user && authorUsernames.every((obj) => obj === user.username)) {
      return FeedType.MY_QUESTIONS_AND_POSTS;
    }

    return FeedType.HOME;
  }, [authorUsernames, forecastedId, selectedTopic, user]);

  const switchFeed = (feedType: FeedType) => {
    clearInReview();
    deleteParam(POST_TOPIC_FILTER);
    deleteParam(POST_FORECASTED_ID_FILTER);
    deleteParam(POST_USERNAMES_FILTER);

    if (feedType === FeedType.MY_PREDICTIONS) {
      user && setParam(POST_FORECASTED_ID_FILTER, user.id.toString());
    }
    if (feedType === FeedType.MY_QUESTIONS_AND_POSTS) {
      user && setParam(POST_USERNAMES_FILTER, user.username.toString());
    }
  };

  // TODO: cleanup status when BE supports pending status
  const clearInReview = () => {
    if (orderBy === QuestionOrder.VotesDesc) {
      deleteParam(POST_ORDER_BY_FILTER, false);
    }
  };

  const selectTopic = (topic: Topic) => {
    clearInReview();
    setParam(POST_TOPIC_FILTER, topic.slug);
    deleteParam(POST_FORECASTED_ID_FILTER);
    setIsMobileExpanded(false);
  };

  return (
    <div className="sticky top-12 z-40 mt-0 self-start sm:top-16 sm:mt-4 lg:top-20">
      <div className="relative w-full border-y border-blue-400 bg-gray-0/75 p-3 backdrop-blur-md no-scrollbar dark:border-blue-700 dark:bg-blue-800/75 sm:max-h-[calc(100vh-76px)] sm:overflow-y-auto sm:border-none sm:bg-blue-200/0 sm:p-2 sm:pt-0 sm:dark:bg-blue-800/0">
        {isMobileExpandable && (
          <>
            <div
              className={classNames(
                "pointer-events-none absolute right-0 top-0 z-20 h-full w-32 bg-gradient-to-r from-transparent to-blue-100 dark:to-blue-800 sm:hidden",
                isMobileExpanded && "hidden"
              )}
            />

            <div
              className={classNames(
                "absolute right-2 z-20 sm:hidden",
                isMobileExpanded ? "bottom-3.5" : "top-3.5"
              )}
            >
              <Button
                aria-label={t("toggleAllTopics")}
                onClick={() => setIsMobileExpanded((prev) => !prev)}
                variant="tertiary"
                presentationType="icon"
              >
                <FontAwesomeIcon
                  className={classNames({ "-rotate-180": !isMobileExpanded })}
                  icon={faArrowUp}
                />
              </Button>
            </div>
          </>
        )}

        <div
          className={classNames(
            "relative z-10 flex snap-x gap-1.5 gap-y-2 overflow-x-auto pr-8 no-scrollbar sm:static sm:w-56 sm:flex-col sm:gap-y-1.5 sm:overflow-hidden sm:p-1 md:w-64",
            isMobileExpanded ? "flex-wrap" : "pr-10"
          )}
        >
          <TopicItem
            text={t("feedHome")}
            emoji={<FontAwesomeIcon icon={faHome} />}
            onClick={() => switchFeed(FeedType.HOME)}
            isActive={currentFeed === FeedType.HOME}
          />
          {user && (
            <>
              <TopicItem
                text={t("myPredictions")}
                emoji={"👤"}
                onClick={() => switchFeed(FeedType.MY_PREDICTIONS)}
                isActive={currentFeed === FeedType.MY_PREDICTIONS}
              />
              <TopicItem
                text={t("myQuestionsAndPosts")}
                emoji={"👤"}
                onClick={() => switchFeed(FeedType.MY_QUESTIONS_AND_POSTS)}
                isActive={currentFeed === FeedType.MY_QUESTIONS_AND_POSTS}
              />
            </>
          )}
          <TopicItem
            isActive={false}
            emoji="🇺🇸"
            text="2024 US Election Hub"
            href="/experiments/elections"
          />

          {!!hotTopics.length && (
            <>
              <Title title={t("topics")} />
              {hotTopics.map((topic) => (
                <TopicItem
                  key={topic.id}
                  isActive={selectedTopic === topic.slug}
                  emoji={topic.emoji}
                  text={topic.name}
                  onClick={() => selectTopic(topic)}
                />
              ))}
            </>
          )}

          {!!hotCategories.length && (
            <>
              <Title title={t("categories")} />
              {hotCategories.map((category) => (
                <TopicItem
                  key={category.id}
                  isActive={selectedTopic === category.slug}
                  emoji={category.emoji}
                  text={category.name}
                  onClick={() => selectTopic(category)}
                />
              ))}
            </>
          )}

          <TopicItem
            href="/questions/discovery"
            text={t("seeAllCategories")}
            emoji={<FontAwesomeIcon icon={faEllipsis} />}
            isActive={false}
          />
          <hr className="mb-0 mt-0"></hr>
          <TopicItem
            href="/questions?status=pending"
            text="In Review"
            emoji={<FontAwesomeIcon icon={faFileClipboard} />}
            isActive={false}
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionTopics;
