import { getTranslations } from "next-intl/server";

import FocusAreaLink, { FocusAreaItem } from "@/app/components/focus_area_link";
import HomeSearch from "@/app/components/home_search";
import FocusAreaAiIcon from "@/app/components/icons/focus_area_ai";
import FocusAreaBiosecurityIcon from "@/app/components/icons/focus_area_biosecurity";
import FocusAreaClimateIcon from "@/app/components/icons/focus_area_climate";
import FocusAreaNuclearIcon from "@/app/components/icons/focus_area_nuclear";
import TopicLink from "@/app/components/topic_link";
import { TOPIC_FILTER } from "@/app/questions/constants/query_params";
import ProjectsApi from "@/services/projects";
import { encodeQueryParams } from "@/utils/query_params";

// TODO: probable makes sense to receive this info from the BE
const FOCUS_AREAS: FocusAreaItem[] = [
  {
    id: "bio",
    title: "Biosecurity",
    Icon: FocusAreaBiosecurityIcon,
    text: "Improving global health by understanding infectious diseases and preparing for future pandemics",
    href: "/questions/?has_group=false&topic=biosecurity&order_by=-activity",
  },
  {
    id: "ai",
    title: "AI Progress",
    Icon: FocusAreaAiIcon,
    text: "Exploring the future of artificial intelligence technologies and the impacts to society",
    href: "/questions/?topic=ai",
  },
  {
    id: "nuc",
    title: "Nuclear Security",
    Icon: FocusAreaNuclearIcon,
    text: "Quantifying global risks to keep us safe and secure for a flourishing future",
    href: "/questions/?has_group=false&topic=nuclear&order_by=-activity",
  },
  {
    id: "cli",
    title: "Climate Change",
    Icon: FocusAreaClimateIcon,
    text: "Predicting long-term shifts in temperature and weather patterns caused by human activity",
    href: "/questions/?has_group=false&topic=climate&order_by=-activity",
  },
];

export default async function Home() {
  const t = await getTranslations();
  const topics = await ProjectsApi.getTopics();

  const hotTopics = topics.filter((t) => t.section === "hot_topics");

  return (
    <main className="bg-gradient-to-b from-metac-blue-100 from-20% to-metac-blue-200 to-50% pt-16 dark:from-metac-blue-100-dark dark:to-metac-blue-200-dark sm:pt-28">
      <div className="mx-auto mb-24 flex w-full max-w-7xl flex-1 flex-col items-stretch px-4 text-metac-blue-700 dark:text-metac-blue-700-dark sm:px-8 md:px-12 lg:px-16">
        <div className="mb-6 md:mb-12 lg:mb-14">
          <div className="flex flex-col items-center">
            <h1 className="mb-5 mt-0 text-balance text-center text-4xl text-metac-blue-800 dark:text-metac-blue-800-dark sm:text-5xl sm:tracking-tight md:text-6xl">
              {t.rich("homeTitle", {
                highlight: (chunks) => (
                  <span className="text-metac-blue-600 dark:text-metac-blue-600-dark">
                    {chunks}
                  </span>
                ),
              })}
            </h1>
            <p className="m-0 max-w-2xl text-balance text-center text-xl text-metac-blue-700 dark:text-metac-blue-700-dark md:text-2xl">
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
        <div className="my-6 md:my-12 lg:my-16">
          <h2 className="mb-5 mt-0 w-full text-center text-4xl font-bold text-metac-blue-800 dark:text-metac-blue-800-dark md:text-5xl">
            {t.rich("focusAreasTitle", {
              highlight: (chunks) => (
                <span className="text-metac-blue-600 dark:text-metac-blue-600-dark">
                  {chunks}
                </span>
              ),
            })}
          </h2>
          <p className="mb-9 mt-0 flex-1 text-center text-xl text-metac-blue-700 dark:text-metac-blue-700-dark">
            {t("focusAreasDescription")}
          </p>
          <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {FOCUS_AREAS.map((focusArea) => (
              <FocusAreaLink key={focusArea.id} {...focusArea} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
