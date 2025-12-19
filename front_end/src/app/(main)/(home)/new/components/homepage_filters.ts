import { PostsParams } from "@/services/api/posts/posts.shared";
import { PostForecastType } from "@/types/post";
import { QuestionType } from "@/types/question";

export type TabId = "popular" | "news" | "new";

export const TABS: { id: TabId; label: string }[] = [
  { id: "popular", label: "Popular" },
  { id: "news", label: "In the news" },
  { id: "new", label: "New" },
];

const allowedTypes = [
  QuestionType.Binary,
  QuestionType.MultipleChoice,
  QuestionType.Numeric,
  QuestionType.Discrete,
  QuestionType.Date,
  PostForecastType.Group,
];

export const FILTERS: Record<TabId, PostsParams> = {
  popular: {
    for_main_feed: "true",
    for_consumer_view: "false",
    order_by: "-hotness",
    statuses: ["open"],
    limit: 7,
    forecast_type: allowedTypes,
  },
  news: {
    for_main_feed: "true",
    statuses: "open",
    order_by: "-news_hotness",
    limit: 7,
    forecast_type: allowedTypes,
  },
  new: {
    for_main_feed: "true",
    for_consumer_view: "false",
    order_by: "-open_time",
    limit: 7,
    forecast_type: allowedTypes,
  },
};
