"use client";
import {
  faHome,
  faEllipsis,
  faArrowUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import TopicItem from "@/app/(main)/questions/components/topic_item";
import {
  ORDER_BY_FILTER,
  TOPIC_FILTER,
} from "@/app/(main)/questions/constants/query_params";
import Button from "@/components/ui/button";
import useSearchParams from "@/hooks/use_search_params";
import { Topic } from "@/types/projects";
import { QuestionOrder } from "@/types/question";

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
  const { params, setParam, deleteParam } = useSearchParams();

  const selectedTopic = params.get(TOPIC_FILTER);
  const orderBy = params.get(ORDER_BY_FILTER);

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

  // TODO: cleanup status when BE supports pending status
  const clearInReview = () => {
    if (orderBy === QuestionOrder.VotesDesc) {
      deleteParam(ORDER_BY_FILTER, false);
    }
  };

  const switchToHomeFeed = () => {
    clearInReview();
    deleteParam(TOPIC_FILTER);
  };

  const selectTopic = (topic: Topic) => {
    clearInReview();
    setParam(TOPIC_FILTER, topic.slug);
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
            onClick={switchToHomeFeed}
            isActive={selectedTopic === null}
          />

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
        </div>
      </div>
    </div>
  );
};

export default QuestionTopics;
