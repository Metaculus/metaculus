import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import { UserBase, UserProfile } from "@/types/users";

export enum ProjectVisibility {
  Normal = "normal",
  NotInMainFeed = "not_in_main_feed",
  Unlisted = "unlisted",
}

export type Project = {
  id: number;
  name: string;
  type: TournamentType | TaxonomyProjectType;
  slug: string;
  posts_count: number;
};

export type LeaderboardTag = Project;

export type Category = Project & {
  description: string;
  emoji?: string;
};

export type NewsCategory = Project & {
  type: TournamentType.NewsCategory;
  is_subscribed?: boolean;
};

export enum TournamentType {
  QuestionSeries = "question_series",
  Tournament = "tournament",
  Index = "index",
  Community = "community",
  NewsCategory = "news_category",
  SiteMain = "site_main",
}

export enum TaxonomyProjectType {
  Topic = "topic",
  Category = "category",
  LeaderboardTag = "leaderboard_tag",
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
  forecasts_count: number;
  forecasters_count: number;
  prize_pool: string | null;
  start_date: string;
  close_date?: string;
  forecasting_end_date?: string;
  is_ongoing: boolean;
  created_at: string;
  questions_count: number;
  user_permission: ProjectPermissions;
  default_permission: ProjectPermissions | null;
  score_type: string;
  followers_count?: number;
  timeline: TournamentTimeline;
};

export type TournamentTimeline = {
  last_cp_reveal_time?: string;
  latest_actual_resolve_time?: string;
  latest_scheduled_resolve_time?: string;
  all_questions_resolved: boolean;
  all_questions_closed: boolean;
};

export type Tournament = TournamentPreview & {
  subtitle: string;
  description: string;
  header_logo: string;
  html_metadata_json?: {
    title: string;
    description: string;
    image_url: string;
  };
  is_subscribed?: boolean;
  add_posts_to_main_feed: boolean;
  visibility: ProjectVisibility;
  default_permission?: ProjectPermissions | null;
  is_current_content_translated?: boolean;
  bot_leaderboard_status?: BotLeaderboardStatus;
  index_weights?: ProjectIndexWeights[];
  timeline: TournamentTimeline;
  forecasts_flow_enabled: boolean;
  index_data?: IndexData | null;
};

export type ProjectIndexWeights = {
  post: PostWithForecasts;
  question_id: number;
  weight: number;
};

export type Community = Project & {
  type: TournamentType.Community;
  description: string;
  header_image: string;
  header_logo: string;
  followers_count: number;
  default_permission: ProjectPermissions;
  user_permission?: ProjectPermissions;
  visibility: ProjectVisibility;
  is_subscribed?: boolean;
  created_by: UserBase;
};

export enum CommunitySettingsMode {
  Questions = "questions",
  Settings = "settings",
}

export enum BotLeaderboardStatus {
  ExcludeAndHide = "exclude_and_hide",
  ExcludeAndShow = "exclude_and_show",
  Include = "include",
  BotsOnly = "bots_only",
}

export type IndexBase = {
  min?: number | null;
  max?: number | null;
  min_label?: string | null;
  max_label?: string | null;
  increasing_is_good?: boolean | null;
};

type IndexStatus = "open" | "resolved";
export type IndexPoint = { x: number; y: number };

export type IndexSeries = {
  line: IndexPoint[];
  status: IndexStatus;
  resolved_at?: string;
  resolution_value?: number;
};

export type IndexSeriesWithBounds = IndexSeries & {
  interval_lower_bounds?: number;
  interval_upper_bounds?: number;
};

type IndexWeights = Record<string, number>;

export type DefaultIndexData = IndexBase & {
  type?: "default";
  series: IndexSeries | null;
  weights: IndexWeights | null;
};

export type MultiYearIndexData = IndexBase & {
  type?: "multi_year";
  series_by_year: Record<string, IndexSeriesWithBounds>;
  weights: IndexWeights;
};

export type IndexData = DefaultIndexData | MultiYearIndexData;
