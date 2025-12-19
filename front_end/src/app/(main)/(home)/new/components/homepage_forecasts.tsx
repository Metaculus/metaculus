"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useState, useTransition } from "react";

import PostCard from "@/components/post_card";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import { ExploreImagesGrid } from "./ExploreImagesGrid";
import { FILTERS, TABS, TabId } from "./homepage_filters";
import { useBreakpoint } from "@/hooks/tailwind";

type Props = {
  initialPopularPosts: PostWithForecasts[];
  className?: string;
};

const HomePageForecasts: FC<Props> = ({ initialPopularPosts, className }) => {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<TabId>("popular");
  const [posts, setPosts] = useState<PostWithForecasts[]>(initialPopularPosts);
  const [isPending, startTransition] = useTransition();
  const [cachedPosts, setCachedPosts] = useState<
    Partial<Record<TabId, PostWithForecasts[]>>
  >({
    popular: initialPopularPosts,
  });

  const tabLabels: Record<TabId, string> = {
    popular: t("popular"),
    news: t("inTheNews"),
    new: t("new"),
  };

  const handleTabChange = (tabId: TabId) => {
    if (tabId === activeTab) return;

    setActiveTab(tabId);

    if (cachedPosts[tabId]) {
      setPosts(cachedPosts[tabId] ?? []);
      return;
    }

    startTransition(async () => {
      const response = await ClientPostsApi.getPostsWithCPForHomepage(
        FILTERS[tabId]
      );
      const newPosts = response.results;
      setCachedPosts((prev) => ({ ...prev, [tabId]: newPosts }));
      setPosts(newPosts);
    });
  };

  const isSmallScreen = !useBreakpoint("md");
  const visiblePosts = isSmallScreen ? posts.slice(0, 3) : posts;

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <h2 className="m-0 text-xl font-bold leading-7 text-gray-1000 dark:text-gray-1000-dark">
        {t("forecasts")}
      </h2>

      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "rounded-full px-3.5 py-2.5 text-sm font-semibold leading-none transition-colors",
              activeTab === tab.id
                ? "bg-gray-300 text-gray-800 dark:bg-gray-300-dark dark:text-gray-800-dark"
                : "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-200 dark:border-gray-300-dark dark:text-gray-700-dark dark:hover:bg-gray-200-dark"
            )}
          >
            {tabLabels[tab.id]}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "mt-3 grid grid-cols-1 gap-4 transition-opacity md:auto-rows-fr md:grid-cols-2 xl:grid-cols-4",
          isPending && "opacity-50"
        )}
      >
        {visiblePosts.map((post) => (
          <div key={post.id} className="[&>*>div]:h-full [&>*]:h-full">
            <PostCard post={post} minimalistic={true} />
          </div>
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
      className="flex flex-col justify-between rounded border border-blue-400 bg-gray-0 p-5 pb-0 no-underline dark:border-blue-400-dark dark:bg-gray-0-dark"
    >
      <div>
        <div className="m-0 flex justify-between text-base font-semibold text-gray-900 dark:text-gray-900-dark">
          <span className="">{t("exploreAll")}</span>
          <span>→</span>
        </div>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-700-dark">
          {t("thousandsOfOpenQuestions")}
        </p>
      </div>

      <div className="mt-auto hidden flex-col items-center self-stretch overflow-hidden md:flex">
        <ExploreImagesGrid className="w-full" />
      </div>
    </Link>
  );
};

export default HomePageForecasts;
