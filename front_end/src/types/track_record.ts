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
  question_id: number;
};

export type TrackRecordCalibrationCurveItem = {
  bin_lower: number;
  bin_upper: number;
  lower_quartile: number;
  middle_quartile: number;
  upper_quartile: number;
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
