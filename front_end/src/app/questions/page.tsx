import QuestionTopics from "@/app/questions/components/question_topics";
import { TOPIC_FILTER } from "@/app/questions/constants/search";
import QuestionCard from "@/components/question_card";
import ProjectsApi from "@/services/projects";
import QuestionsApi, { QuestionsParams } from "@/services/questions";

export default async function Questions({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = processFilters(searchParams);

  const [questions, topics] = await Promise.all([
    QuestionsApi.getQuestionsWithoutForecasts({
      ...filters,
      limit: 10,
    }),
    ProjectsApi.getTopics(),
  ]);

  return (
    <main className="mx-auto min-h-min w-full max-w-5xl flex-auto bg-metac-blue-200 p-0 sm:p-2 sm:pt-0 md:p-3 md:pt-0 lg:mt-16 dark:bg-metac-blue-50-dark">
      <div className="gap-3 p-0 sm:flex sm:flex-row sm:gap-4">
        <QuestionTopics topics={topics} />
        <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
          <div className="flex flex-col gap-3">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function processFilters(
  searchParams: Record<string, string | string[] | undefined>
): Partial<QuestionsParams> {
  const filters: QuestionsParams = {};

  if (typeof searchParams[TOPIC_FILTER] === "string") {
    filters.topic = searchParams[TOPIC_FILTER];
  }

  return filters;
}
