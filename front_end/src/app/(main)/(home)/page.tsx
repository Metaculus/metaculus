import { redirect } from "next/navigation";

import OnboardingCheck from "@/components/onboarding/onboarding_check";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { getPublicSettings } from "@/utils/public_settings.server";
import { convertSidebarItem } from "@/utils/sidebar";

import EmailConfirmation from "./components/email_confirmation";
import FeaturedInMarquee from "./components/featured_in_marquee";
import ForceLightMode from "./components/force_light_mode";
import ForecastsCarouselSection from "./components/forecasts_carousel_section";
import HeroSection from "./components/hero_section";
import { FILTERS } from "./components/homepage_filters";
import StaffPicks from "./components/staff_picks";

export default async function Home() {
  const { PUBLIC_LANDING_PAGE_URL } = getPublicSettings();

  if (PUBLIC_LANDING_PAGE_URL !== "/") {
    return redirect(PUBLIC_LANDING_PAGE_URL);
  }

  const [sidebarItems, initialNewsPosts] = await Promise.all([
    serverMiscApi.getSidebarItems(),
    ServerPostsApi.getPostsWithCP(FILTERS.news),
  ]);

  const hotTopics = sidebarItems
    .filter(({ section }) => section === "hot_topics")
    .map((item) => convertSidebarItem(item));

  return (
    <main className="mx-auto min-h-screen max-w-[1180px] bg-blue-200">
      <ForceLightMode />
      <OnboardingCheck />
      <EmailConfirmation />
      <HeroSection />
      <StaffPicks items={hotTopics} />
      <ForecastsCarouselSection
        initialPosts={initialNewsPosts.results}
        className="mx-auto w-full px-4 pb-8"
      />
      <FeaturedInMarquee />
    </main>
  );
}
