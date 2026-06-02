import { getTranslations } from "next-intl/server";

import {
  ContentParagraph,
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";

import WatchCard from "../components/watch_card";
import { CHAMBER_QUESTIONS } from "../data";

export default async function ThingsToWatchSection() {
  const t = await getTranslations();

  return (
    <SectionCard>
      <SectionHeader className="mb-2">
        {t("midtermsHubThingsToWatch")}
      </SectionHeader>
      <ContentParagraph className="mb-8">
        {t("midtermsHubThingsToWatchSubtitle")}
      </ContentParagraph>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <WatchCard
            questionId={CHAMBER_QUESTIONS.voterTurnout}
            fallbackTitle={t("midtermsHubVoterTurnout")}
          />
          <ContentParagraph small>
            {t("midtermsHubTurnoutContext")}
          </ContentParagraph>
        </div>
        <div className="flex flex-col gap-3">
          <WatchCard
            questionId={CHAMBER_QUESTIONS.electionIntegrity}
            fallbackTitle={t("midtermsHubElectionIntegrity")}
          />
          <ContentParagraph small>
            {t("midtermsHubIntegrityContext")}
          </ContentParagraph>
        </div>
        <div className="flex flex-col gap-3">
          <WatchCard
            questionId={CHAMBER_QUESTIONS.mailInBallots}
            fallbackTitle={t("midtermsHubMailInBallots")}
          />
          <ContentParagraph small>
            {t("midtermsHubMailInBallotsContext")}
          </ContentParagraph>
        </div>
        <div className="flex flex-col gap-3">
          <WatchCard
            questionId={CHAMBER_QUESTIONS.electionEmergency}
            fallbackTitle={t("midtermsHubElectionEmergency")}
          />
          <ContentParagraph small>
            {t("midtermsHubElectionEmergencyContext")}
          </ContentParagraph>
        </div>
      </div>
    </SectionCard>
  );
}
