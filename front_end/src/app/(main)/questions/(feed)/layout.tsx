import ProjectsApi from "@/services/projects";

import QuestionTopics from "../components/question_topics";

export default async function FeedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [topics, categories, tags] = await Promise.all([
    ProjectsApi.getTopics(),
    ProjectsApi.getCategories(),
    ProjectsApi.getTags(),
  ]);

  return (
    <main className="mx-auto mt-4 min-h-min w-full max-w-5xl flex-auto px-0 sm:px-2 md:px-3">
      <div className="gap-3 p-0 sm:flex sm:flex-row sm:gap-4">
        <QuestionTopics topics={topics} />
        <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
          {children}
        </div>
      </div>
    </main>
  );
}
