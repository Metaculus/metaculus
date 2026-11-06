import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import "./world_by_year.css";
import { WorldYearProvider } from "./components/world_year_provider";
import { HeroSection } from "./sections/hero";
import { OverviewSection } from "./sections/overview";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("worldByYearMetaTitle") };
}

export default function WorldByYearPage() {
  return (
    <main>
      <WorldYearProvider>
        <HeroSection />
        <OverviewSection />
      </WorldYearProvider>
    </main>
  );
}
