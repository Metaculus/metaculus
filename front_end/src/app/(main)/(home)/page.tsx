import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import OnboardingCheck from "@/components/onboarding/OnboardingCheck";
import { POST_TOPIC_FILTER } from "@/constants/posts_feed";
import PostsApi from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { PostWithForecasts, PostWithNotebook } from "@/types/post";
import { encodeQueryParams } from "@/utils/navigation";

import EmailConfirmation from "./components/email_confirmation";
import EngageBlock from "./components/engage_block";
import FocusAreaLink, { FocusAreaItem } from "./components/focus_area_link";
import HomeSearch from "./components/home_search";
import FocusAreaAiIcon from "./components/icons/focus_area_ai";
import FocusAreaBiosecurityIcon from "./components/icons/focus_area_biosecurity";
import FocusAreaClimateIcon from "./components/icons/focus_area_climate";
import FocusAreaNuclearIcon from "./components/icons/focus_area_nuclear";
import QuestionCarousel from "./components/questions_carousel";
import ResearchAndUpdatesBlock from "./components/research_and_updates";
import TopicLink from "./components/topic_link";
import TournamentsBlock from "./components/tournaments_block";

export default async function Home() {
  const t = await getTranslations();
  const topics = await ProjectsApi.getTopics();
  const hotTopics = topics.filter((t) => t.section === "hot_topics");

  const FOCUS_AREAS: FocusAreaItem[] = [
    {
      id: "biosecurity",
      title: t("biosecurity"),
      Icon: FocusAreaBiosecurityIcon,
      text: t("biosecurityDescription"),
      href: "/questions/?has_group=false&topic=biosecurity&order_by=-activity",
    },
    {
      id: "ai",
      title: t("aiProgress"),
      Icon: FocusAreaAiIcon,
      text: t("aiProgressDescription"),
      href: "/questions/?topic=ai",
    },
    {
      id: "nuclear",
      title: t("nuclearSecurity"),
      Icon: FocusAreaNuclearIcon,
      text: t("nuclearSecurityDescription"),
      href: "/questions/?has_group=false&topic=nuclear&order_by=-activity",
    },
    {
      id: "climate",
      title: t("climateChange"),
      Icon: FocusAreaClimateIcon,
      text: t("climateChangeDescription"),
      href: "/questions/?has_group=false&topic=climate&order_by=-activity",
    },
  ];

  const homepagePosts = await PostsApi.getPostsForHomepage();
  const postQuestions = homepagePosts.filter(
    (post) => !post.notebook
  ) as unknown as PostWithForecasts[];
  const postNotebooks = homepagePosts.filter(
    (post) => !!post.notebook
  ) as unknown as PostWithNotebook[];

  return (
    <main className="bg-gradient-to-b from-blue-100 from-20% to-blue-200 to-50% pt-16 dark:from-blue-100-dark dark:to-blue-200-dark sm:pt-28">
      <OnboardingCheck />
      <EmailConfirmation />
      <div className="mx-auto mb-24 flex w-full max-w-7xl flex-1 flex-col items-stretch px-4 text-blue-700 dark:text-blue-700-dark sm:px-8 md:px-12 lg:px-16">
        <div className="mb-6 flex flex-col items-center md:mb-12 lg:mb-14">
          <h1 className="mb-5 mt-0 text-balance text-center text-4xl text-blue-800 dark:text-blue-800-dark sm:text-5xl sm:tracking-tight md:text-6xl">
            {t.rich("homeTitle", {
              highlight: (chunks) => (
                <span className="text-blue-600 dark:text-blue-600-dark">
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <span className="m-0 max-w-2xl text-balance text-center text-xl text-blue-700 dark:text-blue-700-dark md:text-2xl">
            {t("homeDescription")}
          </span>
          <div className="mb-4 mt-8 inline-flex w-full flex-col items-center justify-center gap-4 md:mt-12">
            <HomeSearch />
            <div className="line-clamp-3 max-w-2xl text-center md:line-clamp-2">
              <TopicLink
                text={t("2024UsElectionHub")}
                emoji="🇺🇸"
                href="/experiments/elections"
              />
              {hotTopics.map((topic) => (
                <TopicLink
                  key={topic.id}
                  text={topic.name}
                  emoji={topic.emoji}
                  href={`/questions${encodeQueryParams({ [POST_TOPIC_FILTER]: topic.slug })}`}
                />
              ))}
            </div>
          </div>
        </div>
        {!!postQuestions.length && (
          <div className="mt-12">
            <QuestionCarousel posts={postQuestions} />
          </div>
        )}
        <div className="my-6 md:my-12 lg:my-16">
          <h2 className="mb-5 mt-0 w-full text-center text-4xl font-bold text-blue-800 dark:text-blue-800-dark md:text-5xl">
            {t.rich("focusAreasTitle", {
              highlight: (chunks) => (
                <span className="text-blue-600 dark:text-blue-600-dark">
                  {chunks}
                </span>
              ),
            })}
          </h2>
          <p className="mb-9 mt-0 flex-1 text-center text-xl text-blue-700 dark:text-blue-700-dark">
            {t("focusAreasDescription")}
          </p>
          <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            {FOCUS_AREAS.map((focusArea) => (
              <FocusAreaLink key={focusArea.id} {...focusArea} />
            ))}
          </div>
        </div>

        <Suspense>
          <TournamentsBlock />
        </Suspense>
        {!!postNotebooks.length && (
          <Suspense>
            <ResearchAndUpdatesBlock posts={postNotebooks} />
          </Suspense>
        )}
        <EngageBlock />
      </div>
    </main>
  );
}
