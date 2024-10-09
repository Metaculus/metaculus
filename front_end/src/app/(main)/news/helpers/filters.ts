import {
  POST_NEWS_TYPE_FILTER,
  POST_TEXT_SEARCH_FILTER,
} from "@/constants/posts_feed";
import { PostsParams } from "@/services/posts";
import { SearchParams } from "@/types/navigation";
import { ArticleType, NotebookType } from "@/types/post";

// TODO: translate
const ARTICLE_TYPE_LABEL_MAP: Record<ArticleType, string> = {
  [ArticleType.Programs]: "Programs",
  [ArticleType.Research]: "Research",
  [ArticleType.Platform]: "Platform",
};

export const getArticleTypeFilters = (): Array<{
  label: string;
  value: string;
}> =>
  Object.values(ArticleType).map((type) => ({
    label: ARTICLE_TYPE_LABEL_MAP[type] ?? type.toString(),
    value: type,
  }));

export function generateFiltersFromSearchParams(
  searchParams: SearchParams
): PostsParams {
  const filters: PostsParams = {
    forecast_type: NotebookType.Notebook,
    notebook_type: "news",
  };

  if (typeof searchParams[POST_TEXT_SEARCH_FILTER] === "string") {
    filters.search = searchParams[POST_TEXT_SEARCH_FILTER];
  }

  if (typeof searchParams[POST_NEWS_TYPE_FILTER] === "string") {
    filters.news_type = searchParams[POST_NEWS_TYPE_FILTER];
  }

  return filters;
}
