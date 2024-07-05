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

export type LeaderboardEntry = {
  username: string;
  user_id: number;
  leaderboard_type: LeaderboardType;
  score: number;
  coverage: number;
  contribution_count: number;
  medal: string;
  prize: number;
  calculated_on: string;
};

export type LeaderboardDetails = {
  project_id: number;
  type: string;
  leaderboard_type: LeaderboardType;
  name: string;
  slug: string;
  entries: LeaderboardEntry[];
  prize_pool: number;
  start_date: string;
  close_date: string;
  is_ongoing: boolean;
};
