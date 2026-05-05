import Link from "next/link";
import { getTranslations } from "next-intl/server";

import InsightsCarousel from "../components/insights_carousel";
import { MIDTERMS_PROJECT_ID } from "../data";
import { fetchCommunityInsights } from "../helpers/fetch_community_insights";

export default async function CommunityInsightsSection() {
  const t = await getTranslations();
  const insights = await fetchCommunityInsights();

  if (!insights.length) return null;

  return (
    <section className="pt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="m-0 text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-900-dark">
            {t("midtermsHubCommunityInsights")}
          </h2>
          <p className="m-0 mt-1 text-sm text-gray-600 dark:text-gray-600-dark">
            {t("midtermsHubInsightsSubtitle")}
          </p>
        </div>
        <Link
          href={`/questions/?tournaments=${MIDTERMS_PROJECT_ID}`}
          className="text-sm text-blue-600 hover:underline dark:text-blue-600-dark"
        >
          {t("midtermsHubViewAllQuestions")} →
        </Link>
      </div>
      <InsightsCarousel insights={insights} />
    </section>
  );
}
