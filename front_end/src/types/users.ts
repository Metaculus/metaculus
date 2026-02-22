import { SubscriptionEmailType } from "@/types/notifications";
import { AppTheme } from "@/types/theme";
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
  is_active?: boolean;
  is_spam?: boolean;
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
  spam_count?: number;
};

export type CurrentUser = User & {
  email: string;
  is_superuser: boolean;
  is_staff: boolean;
  unsubscribed_mailing_tags: SubscriptionEmailType[];
  unsubscribed_preferences_tags: ProfilePreferencesType[];
  hide_community_prediction: boolean;
  is_onboarding_complete: boolean;
  registered_campaigns: { key: string; details: object }[];
  should_suggest_keyfactors: boolean;
  prediction_expiration_percent: number | null;
  has_password: boolean;
  app_theme?: AppTheme | null;
  interface_type: InterfaceType;
  language?: string | null;
};

export type CurrentBot = CurrentUser & {
  is_primary_bot: boolean;
};

export enum InterfaceType {
  ConsumerView = "consumer_view",
  ForecasterView = "forecaster_view",
}
