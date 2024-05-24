import { addDays } from "date-fns";

import { NumericChartDataset } from "@/types/charts";

export function generateMockNumericChart(): NumericChartDataset {
  const startDate = new Date(2023, 2, 1);
  const numberOfDays = 65;
  const timestamps: number[] = [];
  const values_mean: number[] = [];
  const values_max: number[] = [];
  const values_min: number[] = [];
  const nr_forecasters: number[] = [];

  let currentMean = 200;

  for (let i = 0; i < numberOfDays; i++) {
    const currentDate = addDays(startDate, i);
    timestamps.push(currentDate.getTime());

    currentMean += (Math.random() - 0.5) * 10;
    const mean = currentMean;
    values_mean.push(mean);

    values_max.push(mean + Math.random() * 10);
    values_min.push(mean - Math.random() * 10);

    nr_forecasters.push(Math.floor(150 + Math.random() * 100));
  }

  return {
    timestamps,
    values_mean,
    values_max,
    values_min,
    nr_forecasters,
  };
}
