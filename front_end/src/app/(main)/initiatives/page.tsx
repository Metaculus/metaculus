import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import FeaturedSection from "./sections/featured";
import HeroSection from "./sections/hero";
import InventorySection from "./sections/inventory";

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
      <div className="mx-auto w-full max-w-7xl">
        <HeroSection />
      </div>
      <div className="flex flex-col gap-[110px] bg-gray-0 dark:bg-gray-0-dark">
        <FeaturedSection />
        <InventorySection />
      </div>
    </main>
  );
}
