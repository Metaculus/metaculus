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

export type NotebookIndex = Record<
  string,
  Array<{ questionId: number; weight: number }>
>;
