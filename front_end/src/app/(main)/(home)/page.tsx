import { redirect } from "next/navigation";
import { Suspense } from "react";

import OnboardingCheck from "@/components/onboarding/onboarding_check";
import LoadingIndicator from "@/components/ui/loading_indicator";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { NotebookPost } from "@/types/post";
import { getPublicSettings } from "@/utils/public_settings.server";
import { convertSidebarItem } from "@/utils/sidebar";

import AllCategoriesSection from "./components/all_categories_section";
import EmailConfirmation from "./components/email_confirmation";
import HeroCTAs from "./components/hero_ctas";
import { FILTERS } from "./components/homepage_filters";
import HomePageForecasts from "./components/homepage_forecasts";
import NewsletterSubscription from "./components/newsletter_subscription";
import ResearchAndUpdates from "./components/research_and_updates";
import StaffPicks from "./components/staff_picks";
import TournamentsSection from "./components/tournaments_section";
import WhyMetaculus from "./components/why_metaculus";

export default async function Home() {
  const { PUBLIC_LANDING_PAGE_URL } = getPublicSettings();

  if (PUBLIC_LANDING_PAGE_URL !== "/") {
    return redirect(PUBLIC_LANDING_PAGE_URL);
  }

  const [sidebarItems, homepagePosts, categories, initialNewsPosts] =
    await Promise.all([
      serverMiscApi.getSidebarItems(),
      ServerPostsApi.getPostsForHomepage(),
      ServerProjectsApi.getHomepageCategories(),
      ServerPostsApi.getPostsWithCP(FILTERS.news),
    ]);

  const postNotebooks = homepagePosts.filter(
    (post) => !!post.notebook
  ) as unknown as NotebookPost[];

  const hotTopics = sidebarItems
    .filter(({ section }) => section === "hot_topics")
    .map((item) => convertSidebarItem(item));

  const contentWidthClassNames = "2xl:max-w-[1352px] w-full mx-auto px-4";

  return (
    <main className=" min-h-screen  bg-gray-0 dark:bg-gray-0-dark ">
      <OnboardingCheck />
      <EmailConfirmation />
      <StaffPicks items={hotTopics} />
      <HeroCTAs className={"mx-auto w-full px-0 md:px-4 2xl:max-w-[1352px]"} />
      <div className={contentWidthClassNames}>
        <WhyMetaculus className="mt-3 md:mt-4" />
      </div>
      <div className="w-full bg-gradient-to-b from-gray-0 to-blue-200/50 dark:from-gray-0-dark dark:to-blue-200-dark">
        <div className={contentWidthClassNames}>
          <HomePageForecasts
            initialPosts={initialNewsPosts.results}
            className="mt-6 pb-16 md:mt-8 md:pb-16 lg:mt-16"
          />
        </div>
      </div>
      <Suspense fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}>
        <div className="w-full border-y border-gray-300 bg-gray-100 py-20 dark:border-gray-300-dark dark:bg-gray-100-dark">
          <TournamentsSection className={contentWidthClassNames} />
        </div>
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
      <NewsletterSubscription />
    </main>
  );
}
