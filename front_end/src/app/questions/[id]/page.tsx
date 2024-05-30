import Link from "next/link";

import DetailedQuestionCard from "@/components/detailed_question_card";
import QuestionsApi from "@/services/questions";

export default async function IndividualQuestion({
  params,
}: {
  params: { id: number };
}) {
  const questionData = await QuestionsApi.getQuestion(params.id);

  return (
    <main className="flex flex-col gap-2 p-6">
      <Link
        href={"/"}
        className={"self-start font-bold text-metac-blue-800 hover:opacity-60"}
      >
        Home
      </Link>
      Numeric Chart:
      {questionData && <DetailedQuestionCard question={questionData} />}
    </main>
  );
}
