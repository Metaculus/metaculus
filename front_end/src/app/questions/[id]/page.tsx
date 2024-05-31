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
      <h1 className="text-bold text-2xl text-white">{questionData?.title}</h1>
      {questionData && <DetailedQuestionCard question={questionData} />}
    </main>
  );
}
