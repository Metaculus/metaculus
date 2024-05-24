import { addDays } from "date-fns";

import { MultipleChoiceDataset, NumericChartDataset } from "@/types/charts";

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

export function generateMockMultipleChoiceChart(): MultipleChoiceDataset {
  const numberOfDays = 65;

  const timestamps: number[] = [];
  const nrForecasters: number[] = [];
  const choiceData: { [key: string]: number[] } = {
    "1 to 5": [],
    "6 to 20": [],
    "21 to 100": [],
    "More than 1000": [],
  };
  let date = new Date(2023, 2, 1);

  for (let i = 0; i < numberOfDays; i++) {
    timestamps.push(date.getTime());
    nrForecasters.push(Math.floor(Math.random() * 100) + 1);

    // Randomly distribute forecasters across choices as percentages (0-1 with minimum value)
    const total = Math.random(); // random number between 0 and 1 (exclusive)
    const choiceDistribution = [
      Math.random(),
      Math.random(),
      Math.random(),
      Math.random(),
    ];
    const sum = choiceDistribution.reduce((a, b) => a + b, 0);
    const normalizedDistribution = choiceDistribution.map((val) => val / sum);

    for (const scores of Object.values(choiceData)) {
      const proportion = (normalizedDistribution?.shift() ?? 0) * total;
      scores.push(Math.round(proportion * 100) / 100);
    }

    date = addDays(date, 1);
  }

  return {
    timestamps,
    nr_forecasters: nrForecasters,
    ...choiceData,
  };
}
