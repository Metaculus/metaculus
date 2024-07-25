type NewsArticleMedia = {
  favicon: string | null;
  icon: string | null;
  id: number;
  label: string;
  name: string;
  url: string;
};

export type NewsArticle = {
  date: string;
  id: number;
  media: NewsArticleMedia;
  title: string;
  url: string;
  user_vote: 1 | -1 | null;
};
