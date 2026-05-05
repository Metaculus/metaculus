import { getTranslations } from "next-intl/server";

import {
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";

import InsightsCarousel from "../components/insights_carousel";
import { fetchCommunityInsights } from "../helpers/fetch_community_insights";

export default async function CommunityInsightsSection() {
  const t = await getTranslations();
  const insights = await fetchCommunityInsights();

  if (!insights.length) return null;

  return (
    <SectionCard>
      <InsightsCarousel
        insights={insights}
        title={
          <SectionHeader>{t("midtermsHubCommunityInsights")}</SectionHeader>
        }
      />
    </SectionCard>
  );
}
