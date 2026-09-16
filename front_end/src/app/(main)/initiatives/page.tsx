import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ThemeOverrideContainer } from "@/contexts/theme_override_context";

import FeaturedSection from "./sections/featured";
import HeroSection from "./sections/hero";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("initiativesMetaTitle"),
    description: t("initiativesMetaDescription"),
  };
}

export default function InitiativesPage() {
  return (
    <ThemeOverrideContainer override="light">
      <main className="bg-blue-200">
        <div className="mx-auto w-full max-w-7xl">
          <HeroSection />
        </div>
        <FeaturedSection />
      </main>
    </ThemeOverrideContainer>
  );
}
