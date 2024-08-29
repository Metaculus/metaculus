import { SubscriptionEmailType } from "@/types/notifications";
import {
  TrackRecordScatterPlotItem,
  TrackRecordHistogramItem,
  TrackRecordCalibrationCurveItem,
} from "@/types/track_record";

import { ProfilePreferencesType } from "./preferences";

export type User = {
  id: number;
  username: string;
  is_bot?: boolean;
  is_staff?: boolean;
  first_name?: string;
  last_name?: string;
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
};

export type UserProfile = User & {
  calibration_curve?: TrackRecordCalibrationCurveItem[];
  score_histogram?: TrackRecordHistogramItem[];
  score_scatter_plot?: TrackRecordScatterPlotItem[];
  nr_forecasts?: number;
  nr_comments?: number;
  avg_score?: number;
  questions_predicted_scored?: number;
  questions_predicted?: number;
  question_authored?: number;
  notebooks_authored?: number;
  comments_authored?: number;
};

export type CurrentUser = User & {
  email: string;
  is_superuser: boolean;
  is_staff: boolean;
  unsubscribed_mailing_tags: SubscriptionEmailType[];
  unsubscribed_preferences_tags: ProfilePreferencesType[];
};
