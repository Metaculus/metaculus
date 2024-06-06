type TopicSection = "hot_categories" | "hot_topics";

export type Topic = {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  section: TopicSection;
  questions_count: number;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  questions_count: number;
};

export type Tag = {
  id: number;
  name: string;
  slug: string;
  questions_count: number;
};

export enum TournamentType {
  QuestionSeries = "question_series",
  Tournament = "tournament",
}

export type Tournament = {
  id: number;
  type: TournamentType;
  name: string;
  slug: string | null;
  subtitle: string;
  description: string;
  header_image: string;
  header_logo: string;
  prize_pool: string | null;
  start_date: string;
  close_date: string;
  meta_description: string;
  is_ongoing: boolean;
  created_at: string;
  edited_at: string;
  questions_count: number;
};
