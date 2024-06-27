import { Question } from "./question";

export type ScoreType = "peer" | "spot_peer" | "baseline" | "spot_baseline";

export type LeaderboardType =
  | ScoreType
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
