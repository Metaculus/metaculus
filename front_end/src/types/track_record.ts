import { Resolution } from "@/types/post";

export type TrackRecordHistogramItem = {
  bin_start: number;
  bin_end: number;
  score_count: number;
};

export type TrackRecordScatterPlotItem = {
  score: number;
  score_timestamp: number;
  question_title: string;
  question_resolution: Resolution;
  // It's not a mistake that we're mixing question_ and post_ things here:
  // the question is the thing that is forecast and scored, but a post
  // is the resource you can link to (as a post may contain zero to many questions)
  post_id: number;
};

export type TrackRecordCalibrationCurveItem = {
  bin_lower: number;
  bin_upper: number;
  lower_confidence_interval: number;
  average_resolution: number;
  upper_confidence_interval: number;
  perfect_calibration: number;
};

export type GlobalTrackRecord = {
  calibration_curve: TrackRecordCalibrationCurveItem[];
  score_histogram: TrackRecordHistogramItem[];
  score_scatter_plot: TrackRecordScatterPlotItem[];
  average_score?: number;
  forecasts_count?: number;
  questions_predicted_count?: number;
  score_count?: number;
};
