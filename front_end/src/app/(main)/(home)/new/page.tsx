import { redirect } from "next/navigation";

import { Suspense } from "react";

import OnboardingCheck from "@/components/onboarding/onboarding_check";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { getPublicSettings } from "@/utils/public_settings.server";
import { convertSidebarItem } from "@/utils/sidebar";

import EmailConfirmation from "../components/email_confirmation";
import FutureEvalSection from "./components/future_eval_section";
import HeroCTAs from "./components/hero_ctas";
import { FILTERS } from "./components/homepage_filters";
import HomePageForecasts from "./components/homepage_forecasts";
import StaffPicks from "./components/staff_picks";
import TournamentsSection from "./components/tournaments_section";
import WhyMetaculus from "./components/why_metaculus";
import { NotebookPost } from "@/types/post";
import ResearchAndUpdates from "./components/research_and_updates";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import AllCategoriesSection from "./components/all_categories_section";

export default async function Home() {
  const { PUBLIC_LANDING_PAGE_URL } = getPublicSettings();

  if (PUBLIC_LANDING_PAGE_URL !== "/") {
    return redirect(PUBLIC_LANDING_PAGE_URL);
  }

  const sidebarItems = await serverMiscApi.getSidebarItems();
  const homepagePosts = await ServerPostsApi.getPostsForHomepage();
  const categories = await ServerProjectsApi.getHomepageCategories();

  const postNotebooks = homepagePosts.filter(
    (post) => !!post.notebook
  ) as unknown as NotebookPost[];

  const hotTopics = sidebarItems
    .filter(({ section }) => section === "hot_topics")
    .map((item) => convertSidebarItem(item));

  const initialPopularPosts = await ServerPostsApi.getPostsWithCP(
    FILTERS.popular
  );

  return (
    <main className=" min-h-screen  bg-gray-0 dark:bg-gray-0-dark ">
      <OnboardingCheck />
      <EmailConfirmation />
      <StaffPicks items={hotTopics} />
      <div className="px-4 lg:px-20">
        <HeroCTAs />
        <WhyMetaculus className="mt-4 md:mt-8" />
        <HomePageForecasts
          initialPopularPosts={initialPopularPosts.results}
          className="mt-16 md:mt-8 lg:mt-16"
        />
      </div>
      <Suspense>
        <TournamentsSection className="mt-8 px-4 py-20 lg:px-20" />
      </Suspense>
      <Suspense>
        <FutureEvalSection />
      </Suspense>
      <Suspense>
        <ResearchAndUpdates posts={postNotebooks} />
      </Suspense>
      <Suspense>
        <AllCategoriesSection categories={categories} />
      </Suspense>
    </main>
  );
}
