import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import "./world_by_year.css";
import { DiveDeeperProvider } from "./components/dive_deeper";
import TopBar from "./components/top_bar";
import { WorldYearProvider } from "./components/world_year_provider";
import YearToast from "./components/year_toast";
import { AreaSection } from "./sections/area";
import { FooterSection } from "./sections/footer";
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
        <DiveDeeperProvider>
          <HeroSection />
          <OverviewSection />
          <AreaSection area="sci" />
          <AreaSection area="prog" />
          <AreaSection area="work" />
          <AreaSection area="robo" />
          <AreaSection area="media" />
          <FooterSection />
          <TopBar />
          <YearToast />
        </DiveDeeperProvider>
      </WorldYearProvider>
    </main>
  );
}
