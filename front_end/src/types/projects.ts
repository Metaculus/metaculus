import { ProjectPermissions } from "@/types/post";
import { UserBase, UserProfile } from "@/types/users";

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
  Tournament = "tournament",
  GlobalLeaderboard = "global_leaderboard",
  Community = "community",
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

export type TournamentPreview = {
  id: number;
  type: TournamentType;
  name: string;
  slug: string | null;
  header_image: string;
  prize_pool: string | null;
  start_date: string;
  close_date: string;
  is_ongoing: boolean;
  created_at: string;
  posts_count: number;
  user_permission: ProjectPermissions;
  score_type: string;
};

export type Tournament = TournamentPreview & {
  subtitle: string;
  description: string;
  header_logo: string;
  meta_description: string;
  is_subscribed?: boolean;
  add_posts_to_main_feed: boolean;
  default_permission?: ProjectPermissions | null;
};

export type Community = {
  id: number;
  name: string;
  type: "community";
  slug: string;
  description: string;
  header_image: string;
  header_logo: string;
  followers_count: number;
  default_permission: ProjectPermissions;
  user_permission?: ProjectPermissions;
  unlisted: boolean;
  posts_count: number;
  is_subscribed?: boolean;
  created_by: UserBase;
};

export enum CommunitySettingsMode {
  Questions = "questions",
  Settings = "settings",
}
