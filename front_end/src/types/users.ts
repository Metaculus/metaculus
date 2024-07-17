import { MedalType } from "./scoring";

export type User = {
  id: number;
  username: string;
  is_bot?: boolean;
  is_staff?: boolean;
};

export type UserProfile = User & {
  date_joined: string;
  bio: string;
  website: string;
  formerly_known_as?: string;
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
};

export type CurrentUser = UserProfile & {
  email: string;
  is_superuser: boolean;
};
