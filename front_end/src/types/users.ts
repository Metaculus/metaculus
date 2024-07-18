import { MedalType } from "./scoring";

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
  calibration_curve?: any;
  score_histogram?: any;
  first_name?: string;
  last_name?: string;
  nr_forecasts?: number;
  nr_comments?: number;
};

export type CurrentUser = UserProfile & {
  email: string;
  is_superuser: boolean;
};
