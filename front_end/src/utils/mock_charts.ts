import { addDays } from "date-fns";

import { NumericChartDataset } from "@/types/charts";

export function generateMockNumericChart(): NumericChartDataset {
  const data: NumericChartDataset = {
    timestamps: [],
    values_mean: [],
    values_max: [],
    values_min: [],
    nr_forecasters: [],
  };

  const startDate = new Date();
  const smoothingFactor = 1.5;

  let prevMin = 100;
  let prevMax = 100;
  for (let i = 0; i < 60; i++) {
    const day = addDays(startDate, i);
    const minOffset = Math.random() * 2 - 1;
    const maxOffset = Math.random() * 2 - 1;

    const newMin = Math.max(90, prevMin + minOffset * smoothingFactor);
    const newMax = Math.min(110, prevMax + maxOffset * smoothingFactor);

    const min = newMin * (1 - smoothingFactor) + prevMin * smoothingFactor;
    const max = newMax * (1 - smoothingFactor) + prevMax * smoothingFactor;
    const mean = (max - min) / 2 + min;

    data.timestamps.push(day.getTime()); // Use getTime() for timestamp
    data.values_mean.push(mean);
    data.values_max.push(max);
    data.values_min.push(min);
    data.nr_forecasters.push(Math.floor(Math.random() * 20 + 1));

    prevMin = min;
    prevMax = max;
  }

  return data;
}
