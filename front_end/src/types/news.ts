import { VoteDirection } from "@/types/votes";

export type NewsArticle = {
  created_at: string;
  id: number;
  title: string;
  url: string;
  favicon_url?: string;
  media_label: string;
  user_vote: VoteDirection;
  distance: number;
};

// Admin-only per-article breakdown of a post's "In the news" hotness score.
export type NewsHotnessArticle = {
  id: number;
  title: string;
  url: string;
  media_label: string;
  created_at: string;
  distance: number;
  post_count: number;
  cluster_id: number;
  relevance: number;
  weight: number;
  contribution: number;
  counts_towards_score: boolean;
};

export type NewsHotnessBreakdown = {
  news_hotness: number;
  articles: NewsHotnessArticle[];
};

export type NotebookIndex = Record<
  string,
  Array<{ questionId: number; weight: number }>
>;
