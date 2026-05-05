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
    <main className="mx-auto mb-24 w-full max-w-7xl px-4 sm:px-8 xl:mt-12 xl:px-16">
      <HeroSection />
      <ElectionsMapSection />
      <ThingsToWatchSection />
      <ElectoralConsequencesSection />
      <CommunityInsightsSection />
      <FooterSection />
    </main>
  );
}
