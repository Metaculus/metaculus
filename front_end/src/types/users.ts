import { SubscriptionEmailType } from "@/types/notifications";
import {
  TrackRecordScatterPlotItem,
  TrackRecordHistogramItem,
  TrackRecordCalibrationCurveItem,
} from "@/types/track_record";

import { ProfilePreferencesType } from "./preferences";

export type UserBase = {
  id: number;
  username: string;
  is_bot: boolean;
  is_staff: boolean;
};

export type User = UserBase & {
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
  average_score?: number;
  forecasts_count?: number;
  questions_predicted_count?: number;
  score_count?: number;
  posts_authored_count?: number;
  forecasts_on_authored_questions_count?: number;
  notebooks_authored_count?: number;
  comments_count?: number;
};

export type CurrentUser = User & {
  email: string;
  is_superuser: boolean;
  is_staff: boolean;
  unsubscribed_mailing_tags: SubscriptionEmailType[];
  unsubscribed_preferences_tags: ProfilePreferencesType[];
  hide_community_prediction: boolean;
};

export enum ProfilePageMode {
  Overview = "overview",
  TrackRecord = "track_record",
  Medals = "medals",
  Comments = "comments",
}
