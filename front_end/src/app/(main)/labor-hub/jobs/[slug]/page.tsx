import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { MultiQuestionLineChart } from "@/app/(main)/labor-hub/components/question_cards/multi_question_line_chart";
import { getPublicSettings } from "@/utils/public_settings.server";

import { ALL_JOB_SLUGS, getJobBySlug } from "../../data";
import { CuratedInsights } from "../components/curated_insights";
import { ExposureMetrics } from "../components/exposure_metrics";
import { HubCtaCard } from "../components/hub_cta_card";
import { JobNavStrip } from "../components/job_nav_strip";
import { ShareCard } from "../components/share_card";
import { WageHoursCards } from "../components/wage_hours_cards";
import { YearStats } from "../components/year_stats";
import { fetchJobInsights } from "../helpers/fetch_job_insights";
import { fetchWageAndHours } from "../helpers/fetch_wage_and_hours";
import { fetchWallData } from "../helpers/fetch_wall_data";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return ALL_JOB_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) return {};

  const t = await getTranslations();
  const { PUBLIC_APP_URL } = getPublicSettings();
  const title = t("laborHubJobDetailTitle", { name: job.name });
  const description = t("laborHubJobDetailDescription", { name: job.name });
  const img = `${PUBLIC_APP_URL}/og/labor-hub/jobs/${slug}/route?year=2035`;
  const canonical = `${PUBLIC_APP_URL}/labor-hub/jobs/${slug}/`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [img],
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job) notFound();

  const t = await getTranslations();
  const { PUBLIC_APP_URL } = getPublicSettings();
  const [allJobs, insights, wageHours] = await Promise.all([
    fetchWallData(),
    fetchJobInsights(slug),
    fetchWageAndHours(job.wage_post_id),
  ]);
  const wallEntry = allJobs.find((j) => j.slug === slug);
  const forecasts = wallEntry?.forecasts ?? {
    "2027": null,
    "2030": null,
    "2035": null,
  };

  const navItems = allJobs.map((j) => ({
    slug: j.slug,
    name: j.name,
    value2035: j.forecasts["2035"],
  }));

  const canonical = `${PUBLIC_APP_URL}/labor-hub/jobs/${slug}/`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: t("laborHubJobDetailTitle", { name: job.name }),
    description: t("laborHubJobDetailDescription", { name: job.name }),
    url: canonical,
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "Metaculus",
      url: `${PUBLIC_APP_URL}/`,
    },
    includedInDataCatalog: {
      "@type": "DataCatalog",
      name: "Labor Automation Forecasting Hub",
      url: `${PUBLIC_APP_URL}/labor-hub/`,
    },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "image/png",
      contentUrl: `${PUBLIC_APP_URL}/og/labor-hub/jobs/${slug}/route?year=2035`,
    },
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-8 xl:px-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="rounded-md bg-gray-0 px-6 py-8 dark:bg-gray-0-dark sm:px-9 sm:py-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex items-center gap-2 text-sm text-blue-700 dark:text-blue-700-dark"
        >
          <Link href="/labor-hub/" className="font-medium hover:underline">
            {t("laborHub")}
          </Link>
          <span
            aria-hidden="true"
            className="text-blue-500 dark:text-blue-500-dark"
          >
            /
          </span>
          <Link href="/labor-hub/jobs/" className="font-medium hover:underline">
            {t("laborHubJobsBreadcrumb")}
          </Link>
          <span
            aria-hidden="true"
            className="text-blue-500 dark:text-blue-500-dark"
          >
            /
          </span>
          <span className="font-semibold text-blue-900 dark:text-blue-900-dark">
            {job.name}
          </span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col">
            <h1 className="m-0 text-3xl font-extrabold leading-[1.05] tracking-tight text-blue-900 dark:text-blue-900-dark sm:text-5xl">
              {job.name}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-blue-700 dark:text-blue-700-dark sm:text-lg">
              {t("laborHubJobDetailSubtitle")}
            </p>
            <div className="mt-5">
              <YearStats forecasts={forecasts} />
            </div>
          </div>
          <div className="overflow-hidden rounded-md border border-blue-300 bg-blue-100 p-2 dark:border-blue-300-dark dark:bg-blue-100-dark">
            <MultiQuestionLineChart
              rows={[
                {
                  questionId: job.post_id,
                  title: job.name,
                  historicalValues: { 2025: 0 },
                },
              ]}
              valueFormat="percentageChange"
              decimals={1}
              showLegend={false}
              showMoreButton={false}
              height={260}
              showTickLabels
            />
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-md bg-gray-0 px-6 py-6 dark:bg-gray-0-dark sm:px-9 sm:py-6">
        <JobNavStrip current={slug} items={navItems} />
      </section>

      <section className="mt-6 rounded-md bg-gray-0 px-6 py-8 dark:bg-gray-0-dark sm:px-9 sm:py-10">
        <ExposureMetrics job={job} />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <CuratedInsights insights={insights} jobName={job.name} />
          </div>
          <div className="sm:col-span-1">
            <WageHoursCards values={wageHours} />
          </div>
        </div>
      </section>

      <div className="mt-6">
        <ShareCard
          slug={slug}
          jobName={job.name}
          forecasts={forecasts}
          pageUrl={`${PUBLIC_APP_URL}/labor-hub/jobs/${slug}/`}
        />
      </div>

      <div className="mt-6">
        <HubCtaCard />
      </div>
    </main>
  );
}
