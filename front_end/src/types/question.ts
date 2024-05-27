import { NumericChartDataset } from "./charts";

export interface Question {
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  type: string;
  possibilities: string;
  tags: string[];
  categories: string[];
  topics: string[];
  forecasts: NumericChartDataset;
}
