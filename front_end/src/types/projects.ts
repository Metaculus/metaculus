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
