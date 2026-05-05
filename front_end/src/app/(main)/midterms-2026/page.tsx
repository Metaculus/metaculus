import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getPublicSettings } from "@/utils/public_settings.server";

import CommunityInsightsSection from "./sections/community_insights";
import ElectionsMapSection from "./sections/elections_map_section";
import ElectoralConsequencesSection from "./sections/electoral_consequences";
import FooterSection from "./sections/footer";
import HeroSection from "./sections/hero";
import ThingsToWatchSection from "./sections/things_to_watch";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  const { PUBLIC_APP_URL } = getPublicSettings();
  const title = t("midtermsHubMetaTitle");
  const description = t("midtermsHubMetaDescription");
  const img = `${PUBLIC_APP_URL}/og/midterms-2026/route?theme=dark`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [img],
    },
  };
}

export default function MidtermsHubPage() {
  return (
    <main className="relative mb-24 min-h-screen xl:mt-12">
      <div className="mx-auto w-full max-w-7xl xl:px-16">
        <HeroSection />
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-1 sm:gap-6 sm:px-8 md:gap-8 xl:px-16">
        <ElectionsMapSection />
        <ThingsToWatchSection />
        <ElectoralConsequencesSection />
        <CommunityInsightsSection />
        <FooterSection />
      </div>
    </main>
  );
}
