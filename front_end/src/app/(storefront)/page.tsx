import { redirect } from "next/navigation";

import OnboardingCheck from "@/components/onboarding/onboarding_check";
import serverMiscApi from "@/services/api/misc/misc.server";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { getPublicSettings } from "@/utils/public_settings.server";

import FeaturedInMarquee from "./components/featured_in_marquee";
import ForecastsCarouselSection from "./components/forecasts_carousel_section";
import HeroSection from "./components/hero_section";
import { FILTERS } from "./components/homepage_filters";
import StaffPicks from "./components/staff_picks";
import EmailConfirmation from "../(main)/(home)/components/email_confirmation";

// Edit this list to update Staff Picks on the storefront
const STAFF_PICKS = [
  {
    name: "US Midterms",
    emoji: "🇺🇸",
    url: "/midterms-2026",
  },
  {
    name: "Iran War",
    emoji: "💥",
    url: "/questions/?topic=2026-iran-war",
  },
  {
    name: "Metaculus Cup",
    emoji: "⚔️",
    url: "/tournament/metaculus-cup-spring-2026/",
  },
  {
    name: "Top Questions",
    emoji: "❓",
    url: "/questions/?topic=top-50",
  },
  {
    name: "Current Events",
    emoji: "🗞️",
    url: "/tournament/current-events/",
  },
  {
    name: "Artificial Intelligence",
    emoji: "🤖",
    url: "/questions/?categories=artificial-intelligence",
  },
  {
    name: "Geopolitics",
    emoji: "🌍",
    url: "/questions/?categories=geopolitics",
  },
  {
    name: "Economy and Business",
    emoji: "💼",
    url: "/questions/?categories=economy-business",
  },
  {
    name: "Space",
    emoji: "🚀",
    url: "/questions/?categories=space",
  },
];

export default async function Home() {
  const { PUBLIC_LANDING_PAGE_URL } = getPublicSettings();

  if (PUBLIC_LANDING_PAGE_URL !== "/") {
    return redirect(PUBLIC_LANDING_PAGE_URL);
  }

  const fallbackSiteStats = {
    predictions: 2133159,
    questions: 17357,
    resolved_questions: 6654,
    years_of_predictions: 10,
  };

  const [initialNewsPosts, siteStats] = await Promise.all([
    ServerPostsApi.getPostsWithCP(FILTERS.popular),
    serverMiscApi.getSiteStats().catch(() => fallbackSiteStats),
  ]);

  return (
    <main className="mx-auto w-full max-w-[1180px] flex-1">
      <OnboardingCheck />
      <EmailConfirmation />
      <HeroSection stats={siteStats} />
      <StaffPicks items={STAFF_PICKS} />
      <ForecastsCarouselSection
        initialPosts={initialNewsPosts.results}
        className="mx-auto w-full px-4 pb-8"
      />
      <FeaturedInMarquee />
    </main>
  );
}
