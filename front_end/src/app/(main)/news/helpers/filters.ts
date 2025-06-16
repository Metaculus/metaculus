import {
  POST_NEWS_TYPE_FILTER,
  POST_PAGE_FILTER,
  POST_TEXT_SEARCH_FILTER,
} from "@/constants/posts_feed";
import { PostsParams } from "@/services/api/posts/posts.shared";
import { SearchParams } from "@/types/navigation";
import { NotebookType } from "@/types/post";

export function generateFiltersFromSearchParams(
  searchParams: SearchParams
): PostsParams {
  const filters: PostsParams = {
    forecast_type: NotebookType.Notebook,
  };

  if (typeof searchParams[POST_TEXT_SEARCH_FILTER] === "string") {
    filters.search = searchParams[POST_TEXT_SEARCH_FILTER];
  }

  if (typeof searchParams[POST_NEWS_TYPE_FILTER] === "string") {
    filters.news_type = searchParams[POST_NEWS_TYPE_FILTER];
  }

  if (typeof searchParams[POST_PAGE_FILTER] === "string") {
    filters.page = Number(searchParams[POST_PAGE_FILTER]);
  }

  return filters;
}
