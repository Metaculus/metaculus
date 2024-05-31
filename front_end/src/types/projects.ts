type TopicSection = "hot_categories" | "hot_topics";

export type Topic = {
  id: number;
  name: string;
  emoji: string;
  section: TopicSection;
  questions_count: number;
};
