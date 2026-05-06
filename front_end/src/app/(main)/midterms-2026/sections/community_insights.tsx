import { getTranslations } from "next-intl/server";

import {
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";

import InsightsCarousel from "../components/insights_carousel";
import {
  CommunityInsight,
  fetchCommunityInsights,
} from "../helpers/fetch_community_insights";

export default async function CommunityInsightsSection() {
  const t = await getTranslations();

  // The dashboard should keep rendering even if the insights fetch errors
  // (e.g. comments API hiccup) — treat any failure as a benign empty state.
  let insights: CommunityInsight[] = [];
  try {
    const fetched = await fetchCommunityInsights();
    if (Array.isArray(fetched)) {
      insights = fetched;
    }
  } catch {
    insights = [];
  }

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
