import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AwaitedPostsFeed from "@/components/posts_feed";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POST_NEWS_TYPE_FILTER } from "@/constants/posts_feed";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { SearchParams } from "@/types/navigation";
import { QuestionOrder } from "@/types/question";

import NewsFilters from "./components/news_filters";
import { generateFiltersFromSearchParams } from "./helpers/filters";

export const metadata = {
  title: "News | Metaculus",
  description:
    "Latest updates in forecasting, featuring expert insights, community highlights, and platform developments.",
};

export default async function NewsFeed(props: {
  searchParams: Promise<SearchParams>;
}) {
  return <div>Empty News Feed, no Suspense</div>;

  // If I comment this below, the page loads fine.
  return (
    <Suspense
      key="news-feed"
      fallback={
        <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
      }
    >
      <AwaitedPostsFeed filters={{}} type="news" />
    </Suspense>
  );
}
