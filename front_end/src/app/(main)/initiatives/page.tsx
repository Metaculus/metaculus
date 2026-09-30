import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import FeaturedSection from "./sections/featured";
import HeroSection from "./sections/hero";
import InventorySection from "./sections/inventory";
import ProgramCtaSection from "./sections/program_cta";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("initiativesMetaTitle"),
    description: t("initiativesMetaDescription"),
  };
}

export default function InitiativesPage() {
  return (
    <main className="bg-blue-200 dark:bg-blue-200-dark">
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-b from-blue-200 to-gray-0 dark:from-blue-200-dark dark:to-gray-0-dark"
        />
        <div className="relative mx-auto w-full max-w-7xl">
          <HeroSection />
        </div>
      </div>
      <div className="flex flex-col gap-[110px] bg-gray-0 dark:bg-gray-0-dark">
        <FeaturedSection />
        <InventorySection />
      </div>
      <ProgramCtaSection />
    </main>
  );
}
