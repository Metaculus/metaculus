import { LEADERBOARD_CATEGORIES } from "@/app/(main)/(leaderboards)/leaderboard/filters";
import { Resolution } from "@/types/post";
import { User } from "@/types/users";

import { QuestionType } from "./question";

export type ScoreType = "peer" | "spot_peer" | "baseline" | "spot_baseline";

export type LeaderboardType =
  | "relative_legacy_tournament"
  | "peer_global"
  | "peer_global_legacy"
  | "peer_tournament"
  | "spot_peer_tournament"
  | "spot_baseline_tournament"
  | "baseline_global"
  | "comment_insight"
  | "question_writing"
  | "manual";

export enum MedalsPath {
  Leaderboard = "leaderboard",
  Profile = "profile",
}

export type MedalType = "gold" | "silver" | "bronze";

export type Medal = {
  type: MedalType;
  projectType: MedalProjectType;
  duration?: number;
  year?: number;
  rank?: number;
  totalEntries?: number;
  name?: string;
  projectName: string;
  projectId: number;
  projectSlug: string;
};

export type MedalCategory = {
  name: CategoryKey;
  medals: Medal[];
};

export type BotDetails = {
  metac_bot: boolean;
  base_models?: { name: string; releaseDate?: string }[];
  display_name?: string;
  display_in_leaderboard: boolean;
  include_in_calculations?: boolean;
};

export type LeaderboardEntry = {
  user: (User & { metadata?: { bot_details: BotDetails } }) | null;
  aggregation_method: string | null;
  score: number;
  rank: number | null;
  ci_lower?: number;
  ci_upper?: number;
  excluded: boolean;
  show_when_excluded: boolean;
  medal: MedalType | null;
  prize: number | null;
  coverage: number;
  contribution_count: number;
  calculated_on: string;
  take?: number;
  percent_prize?: number;
};

export enum MedalProjectType {
  SiteMain = "site_main",
  Tournament = "tournament",
  QuestionSeries = "question_series",
}

export type MedalEntry = LeaderboardEntry & {
  project_id: number;
  project_type: MedalProjectType;
  project_name: string;
  project_slug: string;
  score_type: LeaderboardType;
  name?: string;
  start_time?: string;
  end_time?: string;
  finalize_time?: string;
  total_entries?: number;
};

export type MedalRanksEntry = {
  rank: number;
  rank_total: number;
  best_rank: number;
  best_rank_total: number;
  type:
    | "tournaments_global"
    | "peer_global"
    | "baseline_global"
    | "comments_global"
    | "questions_global";
};

type BaseLeaderboardDetails = {
  project_id: number;
  project_type: MedalProjectType;
  project_name: string;
  score_type: LeaderboardType;
  name: string | null;
  start_time: string;
  end_time: string | null;
  finalize_time: string;
  finalized: boolean;
  prize_pool: number | null;
  max_coverage?: number;
};

export type LeaderboardDetails = BaseLeaderboardDetails & {
  entries: LeaderboardEntry[];
  userEntry?: LeaderboardEntry;
};

export type CategoryKey = (typeof LEADERBOARD_CATEGORIES)[number];

export type LeaderboardFilter = {
  label: string;
  value: string;
};
export type LeaderboardFilters = {
  category: CategoryKey;
  durations: LeaderboardFilter[];
  duration: string;
  periods: LeaderboardFilter[];
  year: string;
};

export type Contribution = {
  score: number | null;
  coverage: number | null;
  question_type?: QuestionType;
  question_resolution?: Resolution | "string";
  question_title?: string;
  question_id?: number;
  question_weight?: number;
  post_title?: string;
  post_id?: number;
  comment_text?: string;
  comment_id?: number;
};
export type ContributionDetails = {
  leaderboard_entry: LeaderboardEntry;
  contributions: Contribution[];
  leaderboard: BaseLeaderboardDetails;
  user_id: string;
};
