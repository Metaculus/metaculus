import QuestionCard from "@/components/question_card";
import QuestionsApi from "@/services/questions";

export default async function Questions() {
  const questions = await QuestionsApi.getQuestionsWithoutForecasts({
    limit: 10,
  });

  return (
    <main className="mx-auto min-h-min w-full max-w-5xl flex-auto bg-metac-blue-200 p-0 sm:p-2 sm:pt-0 md:p-3 md:pt-0 lg:mt-16 dark:bg-metac-blue-50-dark">
      <div className="gap-3 p-0 sm:flex sm:flex-row sm:gap-4">
        <div className="sticky top-12 z-40 mt-0 self-start sm:top-16 sm:mt-4 lg:top-20">
          <div className="no-scrollbar relative w-full border-y border-metac-blue-400 bg-metac-gray-0/75 p-3 backdrop-blur-md sm:max-h-[calc(100vh-76px)] sm:overflow-y-auto sm:border-none sm:bg-metac-blue-200/0 sm:p-2 sm:pt-0 dark:border-metac-blue-700 dark:bg-metac-blue-800/75 sm:dark:bg-metac-blue-800/0">
            <div className="no-scrollbar relative z-10 flex snap-x gap-1.5 gap-y-2 overflow-x-auto pr-8 sm:static sm:w-56 sm:flex-col sm:gap-y-1.5 sm:overflow-hidden sm:p-1 md:w-64">
              TODO
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      </div>
    </main>
  );
}
