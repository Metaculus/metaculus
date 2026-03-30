import { PostsParams } from "@/services/api/posts/posts.shared";
import { PostForecastType } from "@/types/post";
import { QuestionType } from "@/types/question";

type FilterId = "news" | "popular" | "new";

const allowedTypes = [
  QuestionType.Binary,
  QuestionType.MultipleChoice,
  QuestionType.Numeric,
  QuestionType.Discrete,
  QuestionType.Date,
  PostForecastType.Group,
];

export const FILTERS: Record<FilterId, PostsParams> = {
  popular: {
    for_main_feed: "true",
    for_consumer_view: "false",
    order_by: "-hotness",
    statuses: ["open"],
    limit: 12,
    forecast_type: allowedTypes,
    access: "public",
  },
  news: {
    for_main_feed: "true",
    statuses: "open",
    order_by: "-news_hotness",
    limit: 12,
    forecast_type: allowedTypes,
    access: "public",
  },
  new: {
    for_main_feed: "true",
    for_consumer_view: "false",
    order_by: "-open_time",
    limit: 12,
    forecast_type: allowedTypes,
    access: "public",
  },
};
