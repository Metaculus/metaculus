import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import "./world_by_year.css";
import { HeroSection } from "./sections/hero";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("worldByYearMetaTitle") };
}

export default function WorldByYearPage() {
  return (
    <main>
      <HeroSection />
    </main>
  );
}
