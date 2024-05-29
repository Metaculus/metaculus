import Link from "next/link";

import NumericChartCard from "@/components/numeric_chard_card";
import QuestionsApi from "@/services/questions";

export default async function IndividualQuestion({
  params,
}: {
  params: { id: number };
}) {
  const questionData = await QuestionsApi.getQuestion(params.id);

  return (
    <main className="flex min-h-screen flex-col gap-2 p-6">
      <Link
        href={"/"}
        className={"self-start font-bold text-metac-blue-800 hover:opacity-60"}
      >
        Home
      </Link>
      Numeric Chart:
      {questionData && <NumericChartCard dataset={questionData.forecasts} />}
    </main>
  );
}
