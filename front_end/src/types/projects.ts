import { ProjectPermissions } from "@/types/post";
import { UserBase, UserProfile } from "@/types/users";

type TopicSection = "hot_categories" | "hot_topics";

export type Project = {
  id: number;
  name: string;
  type: TournamentType;
  slug: string;
  posts_count: number;
};

export type Topic = Project & {
  emoji: string;
  section: TopicSection;
};

export type Category = Project & {
  description: string;
};

export type Tag = Project;
export type NewsCategory = Project & {
  type: "news_category";
};

export enum TournamentType {
  QuestionSeries = "question_series",
  Tournament = "tournament",
  GlobalLeaderboard = "global_leaderboard",
  Community = "community",
  NewsCategory = "news_category",
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

export type TournamentPreview = Project & {
  type: TournamentType;
  header_image: string;
  prize_pool: string | null;
  start_date: string;
  close_date: string;
  is_ongoing: boolean;
  created_at: string;
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
  is_current_content_translated?: boolean;
};

export type Community = Project & {
  type: "community";
  description: string;
  header_image: string;
  header_logo: string;
  followers_count: number;
  default_permission: ProjectPermissions;
  user_permission?: ProjectPermissions;
  unlisted: boolean;
  is_subscribed?: boolean;
  created_by: UserBase;
};

export enum CommunitySettingsMode {
  Questions = "questions",
  Settings = "settings",
}
