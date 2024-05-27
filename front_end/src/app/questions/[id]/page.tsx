import Link from "next/link";

import NumericChartCard from "@/components/numeric_chard_card";
import { getQuestionData } from "@/services/questions";

export default async function IndividualQuestion({
  params,
}: {
  params: { id: number };
}) {
  const questionData = await getQuestionData(params.id);
  console.log("Here 2", questionData);

  return (
    <main className="flex min-h-screen flex-col gap-2 p-6">
      <Link
        href={"/"}
        className={"font-bold text-metac-blue-800 hover:opacity-60 self-start"}
      >
        Home
      </Link>
      Numeric Chart:
      <NumericChartCard dataset={questionData.forecasts} />
    </main>
  );
}
