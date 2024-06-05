import { getTranslations } from "next-intl/server";

import HomeSearch from "@/app/components/home_search";
import TopicLink from "@/app/components/topic_link";
import { TOPIC_FILTER } from "@/app/questions/constants/query_params";
import ProjectsApi from "@/services/projects";
import { encodeQueryParams } from "@/utils/query_params";

export default async function Home() {
  const t = await getTranslations();
  const topics = await ProjectsApi.getTopics();

  const hotTopics = topics.filter((t) => t.section === "hot_topics");

  return (
    <main className="mx-auto mb-24 mt-16 flex w-full max-w-7xl flex-1 flex-col items-stretch px-4 text-metac-blue-700 sm:mt-28 sm:px-8 md:px-12 lg:px-16 dark:text-metac-blue-700-dark">
      <div className="mb-6 md:mb-12 lg:mb-14">
        <div className="flex flex-col items-center">
          <h1 className="mb-5 mt-0 text-balance text-center text-4xl text-metac-blue-800 sm:text-5xl sm:tracking-tight md:text-6xl dark:text-metac-blue-800-dark">
            {t.rich("homeTitle", {
              details: (chunks) => (
                <span className="text-metac-blue-600 dark:text-metac-blue-600-dark">
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <p className="m-0 max-w-2xl text-balance text-center text-xl text-metac-blue-700 md:text-2xl dark:text-metac-blue-700-dark">
            {t("homeDescription")}
          </p>
          <div className="mb-4 mt-8 inline-flex w-full flex-col items-center justify-center gap-4 md:mt-12">
            <HomeSearch />
            <div className="line-clamp-3 max-w-2xl text-center md:line-clamp-2">
              <TopicLink
                text="2024 US Election Hub"
                emoji="🇺🇸"
                href="/experiments/elections"
              />
              {hotTopics.map((topic) => (
                <TopicLink
                  key={topic.id}
                  text={topic.name}
                  emoji={topic.emoji}
                  href={`/questions${encodeQueryParams({ [TOPIC_FILTER]: topic.slug })}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
