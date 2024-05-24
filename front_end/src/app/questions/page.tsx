import Link from "next/link";

import NumericChartCard from "@/components/numeric_chard_card";
import { generateMockNumericChart } from "@/utils/mock_charts";

export default function Questions() {
  const numericDataset = generateMockNumericChart();

  return (
    <main className="flex min-h-screen flex-col gap-2 p-6">
      <Link
        href={"/"}
        className={"font-bold text-metac-blue-800 hover:opacity-60 self-start"}
      >
        Home
      </Link>
      Numeric Chart:
      <NumericChartCard dataset={numericDataset} />
    </main>
  );
}
