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
  { name: "Iran War", emoji: "⚔️", url: "/questions/?topic=iran" },
  { name: "Metaculus Cup", emoji: "🏆", url: "/cup/" },
  {
    name: "Top Questions",
    emoji: "🔥",
    url: "/questions/?for_main_feed=true&order_by=-hotness",
  },
  {
    name: "Current Events",
    emoji: "📰",
    url: "/questions/?categories=current-events",
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
    emoji: "📈",
    url: "/questions/?categories=economy-and-business",
  },
];

export default async function Home() {
  const { PUBLIC_LANDING_PAGE_URL } = getPublicSettings();

  if (PUBLIC_LANDING_PAGE_URL !== "/") {
    return redirect(PUBLIC_LANDING_PAGE_URL);
  }

  let siteStats = {
    predictions: 2133159,
    questions: 17357,
    resolved_questions: 6654,
    years_of_predictions: 10,
  };

  const [initialNewsPosts] = await Promise.all([
    ServerPostsApi.getPostsWithCP(FILTERS.popular),
    serverMiscApi
      .getSiteStats()
      .then((s) => {
        siteStats = s;
      })
      .catch(() => {}),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-[1180px]">
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
