import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import OnboardingCheck from "@/components/onboarding/onboarding_check";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { NotebookPost, PostWithForecasts } from "@/types/post";
import { getPublicSettings } from "@/utils/public_settings.server";
import { convertSidebarItem } from "@/utils/sidebar";

import EmailConfirmation from "../components/email_confirmation";
import HeroCTAs from "./components/hero_ctas";
import StaffPicks from "./components/staff_picks";
import WhyMetaculus from "./components/why_metaculus";

export default async function Home() {
  const { PUBLIC_LANDING_PAGE_URL } = getPublicSettings();

  if (PUBLIC_LANDING_PAGE_URL !== "/") {
    return redirect(PUBLIC_LANDING_PAGE_URL);
  }

  const t = await getTranslations();
  const sidebarItems = await serverMiscApi.getSidebarItems();

  const hotTopics = sidebarItems
    .filter(({ section }) => section === "hot_topics")
    .map((item) => convertSidebarItem(item));

  const homepagePosts = await ServerPostsApi.getPostsForHomepage();
  const postQuestions = homepagePosts.filter(
    (post) => !post.notebook
  ) as unknown as PostWithForecasts[];
  const postNotebooks = homepagePosts.filter(
    (post) => !!post.notebook
  ) as unknown as NotebookPost[];

  return (
    <main className="min-h-screen bg-gray-0 dark:bg-gray-0-dark">
      <OnboardingCheck />
      <EmailConfirmation />
      <StaffPicks items={hotTopics} />
      <div className="px-4 lg:px-20">
        <HeroCTAs />
        <WhyMetaculus className="mt-4 md:mt-8" />
      </div>
    </main>
  );
}
