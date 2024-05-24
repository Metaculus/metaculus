import NumericChartCard from "@/components/numeric_chard_card";
import { generateMockNumericChart } from "@/utils/mock_charts";

export default function Home() {
  const numericDataset = generateMockNumericChart();

  return (
    <main className="flex min-h-screen flex-col items-center gap-2 ">
      Numeric Chart:
      <NumericChartCard dataset={numericDataset} />
    </main>
  );
}
