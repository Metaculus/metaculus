import { ProjectWithLeaderboard } from "./projects";
import { Question } from "./question";

export type ScoreType = "peer" | "spot_peer" | "baseline" | "spot_baseline";

export type LeaderboardType =
  | ScoreType
  | "comment_insight"
  | "question_writing";

export type Score = {
  userId: number;
  for_question: Question;
  score: number;
  coverage: number;
  score_type: ScoreType;
};

export type LeaderboardEntry = {
  username: string;
  user_id: number;
  for_project: ProjectWithLeaderboard;
  leaderboard_type: LeaderboardType;
  score: number;
  coverage: number;
  contribution_count: number;
  medal: string;
  calculated_on: string;
};
