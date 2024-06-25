import { ProjectPermissions } from "@/types/post";
import { UserProfile } from "@/types/users";

type TopicSection = "hot_categories" | "hot_topics";

export type Topic = {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  section: TopicSection;
  posts_count: number;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  posts_count: number;
};

export type Tag = {
  id: number;
  name: string;
  slug: string;
  posts_count: number;
};

export enum TournamentType {
  QuestionSeries = "question_series",
  GlobalLeaderboard = "global_leaderboard",
  Tournament = "tournament",
}

export enum TournamentsSortBy {
  PrizePoolDesc = "-prize_pool",
  CloseDateAsc = "close_date",
  StartDateDesc = "-start_date",
}

export type TournamentMember = {
  user: UserProfile;
  permission: ProjectPermissions;
};

export type ProjectWithLeaderboard = {
  id: number;
  type: TournamentType;
  name: string;
  start_date: string;
  close_date: string;
  is_ongoing: boolean;
  created_at: string;
  edited_at: string;
  user_permission: ProjectPermissions;
};

export type Tournament = ProjectWithLeaderboard & {
  slug: string | null;
  subtitle: string;
  description: string;
  header_image: string;
  header_logo: string;
  prize_pool: string | null;
  meta_description: string;
  posts_count: number;
};
