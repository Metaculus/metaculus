import QuestionCard from "@/components/question_card";
import QuestionsApi from "@/services/questions";

export default async function Questions() {
  const questions = await QuestionsApi.getQuestionsWithoutForecasts();

  return (
    <main className="mx-auto min-h-min w-full max-w-5xl flex-auto bg-metac-blue-200 p-0 sm:p-2 sm:pt-0 md:p-3 md:pt-0 lg:mt-16 dark:bg-metac-blue-50-dark">
      <div className="gap-3 p-0 sm:flex sm:flex-row sm:gap-4">
        <div className="sticky top-12 z-40 mt-0 self-start sm:top-16 sm:mt-4 lg:top-20" />
        <div className="flex flex-col gap-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      </div>
    </main>
  );
}
