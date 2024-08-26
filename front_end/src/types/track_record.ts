import { Resolution } from "@/types/post";

export type TrackRecordHistogramItem = {
  bin_start: number;
  bin_end: number;
  pct_scores: number;
};

export type TrackRecordScatterPlotItem = {
  score: number;
  score_timestamp: number;
  question_title: string;
  question_resolution: Resolution;
};

export type TrackRecordCalibrationCurveItem = {
  user_lower_quartile: number;
  user_middle_quartile: number;
  user_upper_quartile: number;
  perfect_calibration: number;
};

export type GlobalTrackRecord = {
  calibration_curve: TrackRecordCalibrationCurveItem[];
  score_histogram: TrackRecordHistogramItem[];
  score_scatter_plot: TrackRecordScatterPlotItem[];
};
