import Link from "next/link";

import MultipleChoiceChartCard from "@/components/multiple_choice_chart_card";
import NumericChartCard from "@/components/numeric_chard_card";
import {
  generateMockMultipleChoiceChart,
  generateMockNumericChart,
} from "@/utils/mock_charts";

export default function Questions() {
  const numericDataset = generateMockNumericChart();
  const multipleChoiceDataset = generateMockMultipleChoiceChart();

  return (
    <main className="flex flex-col gap-2 p-6">
      <Link
        href={"/"}
        className={"self-start font-bold text-metac-blue-800 hover:opacity-60"}
      >
        Home
      </Link>
      Numeric Chart:
      <NumericChartCard dataset={numericDataset} />
      Multiple Choice Chart:
      <MultipleChoiceChartCard dataset={multipleChoiceDataset} />
    </main>
  );
}
