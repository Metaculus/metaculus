import { LEADERBOARD_CATEGORIES } from "@/app/(main)/(leaderboards)/leaderboard/filters";

import { Question } from "./question";

export type ScoreType = "peer" | "spot_peer" | "baseline" | "spot_baseline";

export type LeaderboardType =
  | "relative_legacy_tournament"
  | "peer_global"
  | "peer_global_legacy"
  | "peer_tournament"
  | "spot_peer_tournament"
  | "baseline_global"
  | "comment_insight"
  | "question_writing";

export type Score = {
  userId: number;
  question: Question;
  score: number;
  coverage: number;
  score_type: ScoreType;
};

export enum MedalsPath {
  Leaderboard = "leaderboard",
  Profile = "profile",
}

export type MedalType = "gold" | "silver" | "bronze";

export type Medal = {
  type: MedalType;
  projectType: MedalProjectType;
  duration: number;
  rank: number;
  totalEntries: number;
  name: string;
  projectName: string;
  projectId: number;
};

export type MedalCategory = {
  name: CategoryKey;
  medals: Medal[];
};

export type LeaderboardEntry = {
  username: string;
  user_id: number;
  score: number;
  rank: number | null;
  excluded: boolean;
  medal: MedalType | null;
  prize: number | null;
  coverage: number;
  contribution_count: number;
  calculated_on: string;
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
  score_type: LeaderboardType;
  name: string;
  start_time: string;
  end_time: string;
  finalize_time: string;
  total_entries: number;
};

export type LeaderboardDetails = {
  project_id: number;
  type: string;
  leaderboard_type: LeaderboardType;
  name: string;
  slug: string;
  entries: LeaderboardEntry[];
  userEntry?: LeaderboardEntry;
  prize_pool: number;
  start_date: string;
  close_date: string;
  is_ongoing: boolean;
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
