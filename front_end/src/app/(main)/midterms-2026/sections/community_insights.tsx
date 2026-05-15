import { getTranslations } from "next-intl/server";

import { MobileCarousel } from "@/app/(main)/labor-hub/components/mobile_carousel";
import {
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";

import InsightCard from "../components/insight_card";
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

  const title = (
    <SectionHeader>{t("midtermsHubCommunityInsights")}</SectionHeader>
  );

  return (
    <SectionCard>
      {/* Desktop: chevron-driven horizontal carousel with edge gradients. */}
      <div className="hidden lg:block">
        <InsightsCarousel insights={insights} title={title} />
      </div>

      {/* Mobile: Labor Hub MobileCarousel — Embla snap-to-center with
          dot indicators, peek-next-card, no edge gradients. The carousel
          adds its own horizontal padding; pull the section padding back
          so slides bleed edge-to-edge. */}
      <div className="lg:hidden">
        <div className="mb-4">{title}</div>
        <div className="-mx-5 md:-mx-10">
          <MobileCarousel>
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </MobileCarousel>
        </div>
      </div>
    </SectionCard>
  );
}
