"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useState, useTransition } from "react";

import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { useBreakpoint } from "@/hooks/tailwind";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import { FILTERS, TABS, TabId } from "./homepage_filters";
import HomepagePostCard from "./homepage_post_card";

type Props = {
  initialPosts: PostWithForecasts[];
  className?: string;
};

const HomePageForecasts: FC<Props> = ({ initialPosts, className }) => {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<TabId>("news");
  const [posts, setPosts] = useState<PostWithForecasts[]>(initialPosts);
  const [isPending, startTransition] = useTransition();
  const [cachedPosts, setCachedPosts] = useState<
    Partial<Record<TabId, PostWithForecasts[]>>
  >({
    news: initialPosts,
  });

  const tabLabels: Record<TabId, string> = {
    news: t("inTheNews"),
    popular: t("popular"),
    new: t("new"),
  };

  const handleTabChange = (tabId: string) => {
    const id = tabId as TabId;
    if (id === activeTab) return;

    setActiveTab(id);

    if (cachedPosts[id]) {
      setPosts(cachedPosts[id] ?? []);
      return;
    }

    startTransition(async () => {
      const response = await ClientPostsApi.getPostsWithCPForHomepage(
        FILTERS[id]
      );
      const newPosts = response.results;
      setCachedPosts((prev) => ({ ...prev, [id]: newPosts }));
      setPosts(newPosts);
    });
  };

  const isSmallScreen = !useBreakpoint("md");
  const visiblePosts = isSmallScreen ? posts.slice(0, 3) : posts;

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <Tabs
        defaultValue="news"
        value={activeTab}
        onChange={handleTabChange}
        className="bg-transparent dark:bg-transparent"
      >
        <TabsList contained className="justify-start gap-1 lg:gap-3">
          {TABS.map((tab) => (
            <TabsTab
              key={tab.id}
              value={tab.id}
              className="px-2 text-sm no-underline sm:px-2 sm:text-sm lg:px-5 lg:text-lg"
              dynamicClassName={(isActive) =>
                !isActive
                  ? "hover:bg-blue-400 dark:hover:bg-blue-400-dark text-blue-800 dark:text-blue-800-dark"
                  : ""
              }
              scrollOnSelect={false}
            >
              {tabLabels[tab.id]}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>

      <div
        className={cn(
          "mt-1 columns-1 gap-4 transition-opacity md:mt-3 md:columns-2 lg:columns-3 xl:columns-4",
          isPending && "opacity-50"
        )}
      >
        {visiblePosts.map((post) => (
          <HomepagePostCard key={post.id} post={post} className="mb-4" />
        ))}

        <ExploreAllCard />
      </div>
    </section>
  );
};

const ExploreAllCard: FC = () => {
  const t = useTranslations();
  return (
    <Link
      href="/questions/"
      className="mb-4 flex break-inside-avoid flex-col rounded border border-blue-400 bg-gray-0 p-5 no-underline dark:border-blue-400-dark dark:bg-gray-0-dark"
    >
      <div>
        <div className="m-0 flex justify-between text-base font-semibold text-gray-900 dark:text-gray-900-dark">
          <span className="">{t("exploreAll")}</span>
          <span>→</span>
        </div>
        <p className="mb-0 mt-2 text-sm text-gray-700 dark:text-gray-700-dark">
          {t("thousandsOfOpenQuestions")}
        </p>
      </div>
    </Link>
  );
};

export default HomePageForecasts;
