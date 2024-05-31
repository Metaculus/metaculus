"use client";
import { faHome, faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import TopicItem from "@/app/questions/components/topic_item";
import { Topic } from "@/types/projects";

const Title: FC<{ title: string }> = ({ title }) => (
  <div className="mt-1 hidden pl-2 text-sm font-bold uppercase tracking-wide text-metac-gray-500 sm:block dark:text-metac-gray-500-dark">
    {title}
  </div>
);

type Props = {
  topics: Topic[];
};

const QuestionTopics: FC<Props> = ({ topics }) => {
  const t = useTranslations();

  const { hotTopics, hotCategories } = useMemo(
    () => ({
      hotTopics: topics.filter((t) => t.section === "hot_topics"),
      hotCategories: topics.filter((t) => t.section === "hot_categories"),
    }),
    [topics]
  );

  const switchToHomeFeed = () => {};

  return (
    <div className="sticky top-12 z-40 mt-0 self-start sm:top-16 sm:mt-4 lg:top-20">
      <div className="no-scrollbar relative w-full border-y border-metac-blue-400 bg-metac-gray-0/75 p-3 backdrop-blur-md sm:max-h-[calc(100vh-76px)] sm:overflow-y-auto sm:border-none sm:bg-metac-blue-200/0 sm:p-2 sm:pt-0 dark:border-metac-blue-700 dark:bg-metac-blue-800/75 sm:dark:bg-metac-blue-800/0">
        <div className="no-scrollbar relative z-10 flex snap-x gap-1.5 gap-y-2 overflow-x-auto pr-8 sm:static sm:w-56 sm:flex-col sm:gap-y-1.5 sm:overflow-hidden sm:p-1 md:w-64">
          <TopicItem
            text={t("feedHome")}
            emoji={<FontAwesomeIcon icon={faHome} />}
            onClick={switchToHomeFeed}
            isActive={false}
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
                  isActive={false}
                  emoji={topic.emoji}
                  text={topic.name}
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
                  isActive={false}
                  emoji={category.emoji}
                  text={category.name}
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
