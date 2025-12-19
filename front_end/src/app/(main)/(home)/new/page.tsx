import { redirect } from "next/navigation";
import { Suspense } from "react";

import OnboardingCheck from "@/components/onboarding/onboarding_check";
import LoadingIndicator from "@/components/ui/loading_indicator";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { NotebookPost } from "@/types/post";
import cn from "@/utils/core/cn";
import { getPublicSettings } from "@/utils/public_settings.server";
import { convertSidebarItem } from "@/utils/sidebar";

import EmailConfirmation from "../components/email_confirmation";
import AllCategoriesSection from "./components/all_categories_section";
import FutureEvalSection from "./components/future_eval_section";
import HeroCTAs from "./components/hero_ctas";
import { FILTERS } from "./components/homepage_filters";
import HomePageForecasts from "./components/homepage_forecasts";
import ResearchAndUpdates from "./components/research_and_updates";
import StaffPicks from "./components/staff_picks";
import TournamentsSection from "./components/tournaments_section";
import WhyMetaculus from "./components/why_metaculus";

export default async function Home() {
  const { PUBLIC_LANDING_PAGE_URL } = getPublicSettings();

  if (PUBLIC_LANDING_PAGE_URL !== "/") {
    return redirect(PUBLIC_LANDING_PAGE_URL);
  }

  const [sidebarItems, homepagePosts, categories, initialPopularPosts] =
    await Promise.all([
      serverMiscApi.getSidebarItems(),
      ServerPostsApi.getPostsForHomepage(),
      ServerProjectsApi.getHomepageCategories(),
      ServerPostsApi.getPostsWithCP(FILTERS.popular),
    ]);

  const postNotebooks = homepagePosts.filter(
    (post) => !!post.notebook
  ) as unknown as NotebookPost[];

  const hotTopics = sidebarItems
    .filter(({ section }) => section === "hot_topics")
    .map((item) => convertSidebarItem(item));

  const contentWidthClassNames =
    "2xl:max-w-[1352px] w-full md:max-2xl:px-20 mx-auto px-4";

  return (
    <main className=" min-h-screen  bg-gray-0 dark:bg-gray-0-dark ">
      <OnboardingCheck />
      <EmailConfirmation />
      <StaffPicks items={hotTopics} />
      <div className={cn(contentWidthClassNames, "pr-0")}>
        <HeroCTAs className="pr-4 md:pr-0" />
      </div>
      <div className={contentWidthClassNames}>
        <WhyMetaculus className="mt-4 md:mt-8" />
        <HomePageForecasts
          initialPopularPosts={initialPopularPosts.results}
          className="mt-16 md:mt-8 lg:mt-16"
        />
      </div>
      <Suspense fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}>
        <div className="mt-8 w-full border-y border-gray-300  bg-gray-100 py-20 dark:border-gray-300-dark dark:bg-gray-100-dark md:mt-16 ">
          <TournamentsSection className={contentWidthClassNames} />
        </div>
      </Suspense>
      <Suspense fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}>
        <FutureEvalSection className={contentWidthClassNames} />
      </Suspense>
      <Suspense fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}>
        <div className="border-y border-gray-300 bg-gray-100  py-20 dark:border-gray-300-dark dark:bg-gray-100-dark">
          <ResearchAndUpdates
            posts={postNotebooks}
            className={contentWidthClassNames}
          />
        </div>
      </Suspense>
      <Suspense fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}>
        <AllCategoriesSection
          categories={categories}
          className={contentWidthClassNames}
        />
      </Suspense>
    </main>
  );
}
