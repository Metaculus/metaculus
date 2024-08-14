import { VoteDirection } from "@/types/votes";

type NewsArticleMedia = {
  favicon: string | null;
  icon: string | null;
  name: string;
  url: string;
};

export type NewsArticle = {
  created_at: string;
  id: number;
  title: string;
  url: string;
  favicon_url?: string;
  media_label: string;
  user_vote: VoteDirection;
};
