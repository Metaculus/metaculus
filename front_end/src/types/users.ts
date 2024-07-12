export type UserProfile = {
  id: number;
  username: string;
  date_joined: string;
  bio: string;
  website: string;
  formerly_known_as?: string;
  is_bot: boolean;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
  github?: string;
  good_judgement_open?: string;
  kalshi?: string;
  manifold?: string;
  infer?: string;
  hypermind?: string;
  occupation?: string;
  location?: string;
  profile_picture?: string;
  tournament_medals?: Record<string, number>;
  peer_score_medals?: Record<string, number>;
  baseline_medals?: Record<string, number>;
  comment_insight_medals?: Record<string, number>;
  question_writing_medals?: Record<string, number>;
  calibration_curve?: any;
  score_histogram?: any;
};

export type CurrentUser = UserProfile & {
  email: string;
  is_superuser: boolean;
};
