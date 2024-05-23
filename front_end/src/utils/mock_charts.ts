import { NumericChartDataset } from "@/types/charts";

export function generateMockNumericChart(): NumericChartDataset {
  const data: NumericChartDataset = {
    timestamps: [],
    values_mean: [],
    values_max: [],
    values_min: [],
    nr_forecasters: [],
  };

  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  for (let i = 0; i < 100; i++) {
    const min = Math.random() * 10 + 90;
    const max = Math.random() * 10 + 110;
    const mean = (max - min) / 2 + min;

    data.timestamps.push(now + i * oneHour);
    data.values_mean.push(mean);
    data.values_max.push(max);
    data.values_min.push(min);
    data.nr_forecasters.push(Math.floor(Math.random() * 20 + 1));
  }

  return data;
}
