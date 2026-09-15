import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
    <main className="min-h-screen bg-blue-200 dark:bg-blue-200-dark">
      <div className="mx-auto w-full max-w-7xl">
        <HeroSection />
        <div id="initiatives-featured" className="scroll-mt-nav" />
      </div>
    </main>
  );
}
