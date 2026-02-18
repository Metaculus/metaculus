"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useRef, useState, useTransition } from "react";

import Button from "@/components/ui/button";
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs";
import { useBreakpoint } from "@/hooks/tailwind";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { isConditionalPost, isNotebookPost } from "@/utils/questions/helpers";

import { FILTERS, TABS, TabId } from "./homepage_filters";
import HomepagePostCard from "./homepage_post_card";

const MOBILE_POSTS_INCREMENT = 3;

type Props = {
  initialPosts: PostWithForecasts[];
  className?: string;
};

const filterValidPosts = (posts: PostWithForecasts[]): PostWithForecasts[] =>
  posts.filter((post) => !isConditionalPost(post) && !isNotebookPost(post));

const HomePageForecasts: FC<Props> = ({ initialPosts, className }) => {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<TabId>("news");
  const activeTabRef = useRef<TabId>(activeTab);
  const filteredInitialPosts = filterValidPosts(initialPosts);
  const [posts, setPosts] = useState<PostWithForecasts[]>(filteredInitialPosts);
  const [isPending, startTransition] = useTransition();
  const [cachedPosts, setCachedPosts] = useState<
    Partial<Record<TabId, PostWithForecasts[]>>
  >({
    news: filteredInitialPosts,
  });
  const [mobileVisibleCount, setMobileVisibleCount] = useState(
    MOBILE_POSTS_INCREMENT
  );

  const tabLabels: Record<TabId, string> = {
    news: t("inTheNews"),
    popular: t("popular"),
    new: t("new"),
  };

  const handleTabChange = (tabId: string) => {
    const id = tabId as TabId;
    if (id === activeTab) return;

    setActiveTab(id);
    activeTabRef.current = id;
    setMobileVisibleCount(MOBILE_POSTS_INCREMENT);

    if (cachedPosts[id]) {
      setPosts(cachedPosts[id] ?? []);
      return;
    }

    startTransition(async () => {
      const response = await ClientPostsApi.getPostsWithCPForHomepage(
        FILTERS[id]
      );
      const newPosts = filterValidPosts(response.results);

      if (activeTabRef.current !== id) {
        return;
      }

      setCachedPosts((prev) => ({ ...prev, [id]: newPosts }));
      setPosts(newPosts);
    });
  };

  const isSmallScreen = !useBreakpoint("md");
  const visiblePosts = isSmallScreen
    ? posts.slice(0, mobileVisibleCount)
    : posts;
  const hasMorePosts = isSmallScreen && mobileVisibleCount < posts.length;

  const handleLoadMore = () => {
    setMobileVisibleCount((prev) => prev + MOBILE_POSTS_INCREMENT);
  };

  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <Tabs
        defaultValue="news"
        value={activeTab}
        onChange={handleTabChange}
        className="bg-transparent dark:bg-transparent"
      >
        <TabsList contained className="justify-between gap-1 lg:gap-3">
          <div className="flex gap-1 lg:gap-3">
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
          </div>
          <Link
            href="/questions/"
            className="flex items-center gap-2 whitespace-nowrap rounded-full bg-gray-0 px-2 py-1 text-sm text-blue-800 no-underline transition-colors hover:bg-blue-400 dark:bg-gray-0-dark dark:text-blue-800-dark dark:hover:bg-blue-400-dark lg:px-5 lg:py-1.5 lg:text-lg lg:leading-[26px]"
          >
            <span className="sm:hidden">{t("feed")}</span>
            <span className="hidden sm:inline">{t("questionFeed")}</span>
            <FontAwesomeIcon
              icon={faArrowRight}
              className="text-sm text-blue-600 dark:text-blue-600-dark"
            />
          </Link>
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
      </div>

      {hasMorePosts && (
        <div className="mt-4 flex justify-center md:hidden">
          <Button variant="tertiary" onClick={handleLoadMore}>
            {t("loadMore")}
          </Button>
        </div>
      )}
    </section>
  );
};

export default HomePageForecasts;
