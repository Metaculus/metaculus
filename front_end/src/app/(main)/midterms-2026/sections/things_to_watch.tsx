import { getTranslations } from "next-intl/server";
import { ReactNode } from "react";

import { MobileCarousel } from "@/app/(main)/labor-hub/components/mobile_carousel";
import {
  ContentParagraph,
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";

import WatchCard from "../components/watch_card";
import { CHAMBER_QUESTIONS } from "../data";

export default async function ThingsToWatchSection() {
  const t = await getTranslations();

  const slides: { id: number; title: string; context: string }[] = [
    {
      id: CHAMBER_QUESTIONS.electionEmergency,
      title: t("midtermsHubElectionEmergency"),
      context: t("midtermsHubElectionEmergencyContext"),
    },
    {
      id: CHAMBER_QUESTIONS.abortionAmendment,
      title: t("midtermsHubAbortionAmendment"),
      context: t("midtermsHubAbortionAmendmentContext"),
    },
    {
      id: CHAMBER_QUESTIONS.mailInBallots,
      title: t("midtermsHubMailInBallots"),
      context: t("midtermsHubMailInBallotsContext"),
    },
  ];

  const renderSlide = (s: (typeof slides)[number]): ReactNode => (
    <div key={s.id} className="flex flex-col gap-3">
      <WatchCard questionId={s.id} fallbackTitle={s.title} />
      <ContentParagraph small>{s.context}</ContentParagraph>
    </div>
  );

  return (
    <SectionCard>
      <SectionHeader className="mb-2">
        {t("midtermsHubThingsToWatch")}
      </SectionHeader>
      <ContentParagraph className="mb-8">
        {t("midtermsHubThingsToWatchSubtitle")}
      </ContentParagraph>

      {/* Desktop: 3-column grid. */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-3">
        {slides.map(renderSlide)}
      </div>

      {/* Mobile: stepped carousel (Embla snap-to-center with dot indicators).
          The carousel adds its own horizontal padding; pull the section
          padding back so slides bleed edge-to-edge. */}
      <div className="-mx-5 md:-mx-10 lg:hidden">
        <MobileCarousel>{slides.map(renderSlide)}</MobileCarousel>
      </div>
    </SectionCard>
  );
}
