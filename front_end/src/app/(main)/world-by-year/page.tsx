import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import "./world_by_year.css";
import { DiveDeeperProvider } from "./components/dive_deeper";
import PointerFocusMode from "./components/pointer_focus_mode";
import { WORLD_BY_YEAR_THEME_CLASSNAME } from "./components/theme";
import TopBar from "./components/top_bar";
import { WorldDataProvider } from "./components/world_data_provider";
import { WorldYearProvider } from "./components/world_year_provider";
import YearToast from "./components/year_toast";
import { CURATED_QUESTIONS } from "./data/questions";
import { SAMPLE_FORECASTS } from "./data/sample_forecasts";
import { buildWorldQuestions } from "./helpers/world_questions";
import { AreaSection } from "./sections/area";
import { FooterSection } from "./sections/footer";
import { HeroSection } from "./sections/hero";
import { OverviewSection } from "./sections/overview";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("worldByYearMetaTitle") };
}

export default async function WorldByYearPage() {
  const questions = buildWorldQuestions(CURATED_QUESTIONS, SAMPLE_FORECASTS);

  if (!questions.length) {
    const t = await getTranslations();
    return (
      <main className={WORLD_BY_YEAR_THEME_CLASSNAME}>
        <p className="mx-auto max-w-[1280px] px-[var(--wby-pad)] py-24 font-sans text-[var(--wby-fg)]">
          {t("worldByYearNoForecasts")}
        </p>
      </main>
    );
  }

  return (
    <main>
      <WorldDataProvider questions={questions}>
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
            <PointerFocusMode />
          </DiveDeeperProvider>
        </WorldYearProvider>
      </WorldDataProvider>
    </main>
  );
}
