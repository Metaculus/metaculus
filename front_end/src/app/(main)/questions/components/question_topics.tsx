"use client";
import {
  faArrowUp,
  faEllipsis,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import useFeed from "@/app/(main)/questions/hooks/use_feed";
import { useContentTranslatedBannerProvider } from "@/app/providers";
import Button from "@/components/ui/button";
import { FeedType, POST_TOPIC_FILTER } from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import useSearchParams from "@/hooks/use_search_params";
import { Topic } from "@/types/projects";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/cn";

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
  const { params, setParam, clearParams } = useSearchParams();

  const { switchFeed, currentFeed } = useFeed();
  const selectedTopic = params.get(POST_TOPIC_FILTER);

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

  const { bannerIsVisible: isTranslationBannerVisible } =
    useContentTranslatedBannerProvider();

  const selectTopic = (topic: Topic) => {
    clearParams();
    setParam(POST_TOPIC_FILTER, topic.slug);
    setIsMobileExpanded(false);
  };

  const topPositionClasses = isTranslationBannerVisible
    ? "top-24 lg:top-20"
    : "top-12 lg:top-20";

  const { PUBLIC_MINIMAL_UI } = usePublicSettings();

  return (
    <div
      className={cn(
        "sticky z-40 mt-0 self-start sm:top-16 sm:mt-4",
        topPositionClasses
      )}
    >
      <div className="relative w-full border-y border-blue-400 bg-gray-0/75 p-3 backdrop-blur-md no-scrollbar dark:border-blue-700 dark:bg-blue-800/75 sm:max-h-[calc(100vh-76px)] sm:overflow-y-auto sm:border-none sm:bg-blue-200/0 sm:p-2 sm:pt-0 sm:dark:bg-blue-800/0">
        {isMobileExpandable && (
          <>
            <div
              className={cn(
                "pointer-events-none absolute right-0 top-0 z-20 h-full w-32 bg-gradient-to-r from-transparent to-blue-100 dark:to-blue-800 sm:hidden",
                isMobileExpanded && "hidden"
              )}
            />

            <div
              className={cn(
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
                  className={cn({ "-rotate-180": !isMobileExpanded })}
                  icon={faArrowUp}
                />
              </Button>
            </div>
          </>
        )}

        <div
          className={cn(
            "relative z-10 flex snap-x gap-1.5 gap-y-2 overflow-x-auto pr-8 no-scrollbar sm:static sm:w-56 sm:flex-col sm:gap-y-1.5 sm:overflow-hidden sm:p-1 md:w-[210px] md:px-0 min-[812px]:w-64 min-[812px]:px-1",
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
                onClick={() => {
                  sendAnalyticsEvent("sidebarClick", {
                    event_category: t("myPredictions"),
                  });
                  switchFeed(FeedType.MY_PREDICTIONS);
                }}
                isActive={currentFeed === FeedType.MY_PREDICTIONS}
              />
              <TopicItem
                text={t("myQuestionsAndPosts")}
                emoji={"✍️"}
                onClick={() => {
                  sendAnalyticsEvent("sidebarClick", {
                    event_category: t("myQuestionsAndPosts"),
                  });
                  switchFeed(FeedType.MY_QUESTIONS_AND_POSTS);
                }}
                isActive={currentFeed === FeedType.MY_QUESTIONS_AND_POSTS}
              />
              <TopicItem
                text={t("followingButton")}
                emoji={"🔎 "}
                onClick={() => {
                  sendAnalyticsEvent("sidebarClick", {
                    event_category: t("followingButton"),
                  });
                  switchFeed(FeedType.FOLLOWING);
                }}
                isActive={currentFeed === FeedType.FOLLOWING}
              />
            </>
          )}
          {!PUBLIC_MINIMAL_UI && ( // TODO: these should be database driven
            <>
              <TopicItem
                emoji="👥"
                text={t("communities")}
                onClick={() => {
                  sendAnalyticsEvent("sidebarClick", {
                    event_category: "Communities",
                  });
                  switchFeed(FeedType.COMMUNITIES);
                }}
                isActive={currentFeed === FeedType.COMMUNITIES}
              />
              <TopicItem
                isActive={false}
                emoji="🤖"
                text="Q2 AI Benchmarking"
                href="/aib"
                onClick={() =>
                  sendAnalyticsEvent("sidebarClick", {
                    event_category: "AI Benchmarking",
                  })
                }
              />
              <TopicItem
                isActive={false}
                emoji="🌍"
                text="USAID Outlook"
                href="/tournament/usaid/"
                onClick={() =>
                  sendAnalyticsEvent("sidebarClick", {
                    event_category: "USAID Outlook",
                  })
                }
              />
              <TopicItem
                isActive={false}
                emoji="🏛️"
                text="POTUS"
                href="/tournament/POTUS-predictions/"
                onClick={() =>
                  sendAnalyticsEvent("sidebarClick", {
                    event_category: "POTUS",
                  })
                }
              />
              <TopicItem
                isActive={false}
                emoji="💵"
                text="Fiscal"
                href="/tournament/fiscal/"
                onClick={() =>
                  sendAnalyticsEvent("sidebarClick", {
                    event_category: "Fiscal",
                  })
                }
              />
            </>
          )}
          {!!hotTopics.length && (
            <>
              <Title title={t("topics")} />
              {hotTopics.map((topic) => (
                <TopicItem
                  key={topic.id}
                  isActive={selectedTopic === topic.slug}
                  emoji={topic.emoji}
                  text={topic.name}
                  onClick={() => {
                    sendAnalyticsEvent("sidebarClick", {
                      event_category: topic.name,
                    });
                    selectTopic(topic);
                  }}
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
                  onClick={() => {
                    sendAnalyticsEvent("sidebarClick", {
                      event_category: category.name,
                    });
                    selectTopic(category);
                  }}
                />
              ))}
            </>
          )}

          <TopicItem
            href="/questions/discovery"
            text={t("seeAllCategories")}
            emoji={<FontAwesomeIcon icon={faEllipsis} />}
            isActive={false}
            onClick={() => {
              sendAnalyticsEvent("sidebarClick", {
                event_category: t("seeAllCategories"),
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionTopics;
