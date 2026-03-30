import { redirect } from "next/navigation";

import OnboardingCheck from "@/components/onboarding/onboarding_check";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { getPublicSettings } from "@/utils/public_settings.server";
import { convertSidebarItem } from "@/utils/sidebar";

import EmailConfirmation from "../(main)/(home)/components/email_confirmation";
import FeaturedInMarquee from "../(main)/(home)/components/featured_in_marquee";
import ForecastsCarouselSection from "../(main)/(home)/components/forecasts_carousel_section";
import HeroSection from "../(main)/(home)/components/hero_section";
import { FILTERS } from "../(main)/(home)/components/homepage_filters";
import StaffPicks from "../(main)/(home)/components/staff_picks";

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
    <main className="mx-auto min-h-screen max-w-[1180px]">
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
