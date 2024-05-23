import NumericChart from "@/components/numeric_chart";
import { generateMockNumericChart } from "@/utils/mock_charts";

const NUMERIC_DATASET = generateMockNumericChart();

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-2 p-24">
      Numeric Chart:
      <div className="w-full max-w-[743px]">
        <NumericChart dataset={NUMERIC_DATASET} />
      </div>
    </main>
  );
}
