import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getPublicSettings } from "@/utils/public_settings.server";

import { HubCtaCard } from "./components/hub_cta_card";
import { JobsWall } from "./components/jobs_wall";
import { fetchTileTickers } from "./helpers/fetch_tile_tickers";
import { fetchWallData } from "./helpers/fetch_wall_data";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  const { PUBLIC_APP_URL } = getPublicSettings();
  const title = t("laborHubJobsPageTitle");
  const description = t("laborHubJobsPageDescription");
  // TODO(stage-5): point to a dedicated /og/labor-hub/jobs/ image
  const img = `${PUBLIC_APP_URL}/og/labor-hub/route?theme=dark`;

  return {
    title,
    description,
    alternates: { canonical: `${PUBLIC_APP_URL}/labor-hub/jobs/` },
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

export default async function AllJobsPage() {
  const t = await getTranslations();
  const { PUBLIC_APP_URL } = getPublicSettings();
  const [jobs, tickers] = await Promise.all([
    fetchWallData(),
    fetchTileTickers(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("laborHubJobsPageTitle"),
    description: t("laborHubJobsPageDescription"),
    url: `${PUBLIC_APP_URL}/labor-hub/jobs/`,
    numberOfItems: jobs.length,
    itemListElement: jobs.map((job, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${PUBLIC_APP_URL}/labor-hub/jobs/${job.slug}/`,
      name: job.name,
    })),
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
          <span className="font-semibold text-blue-900 dark:text-blue-900-dark">
            {t("laborHubJobsBreadcrumb")}
          </span>
        </nav>
        <h1 className="m-0 max-w-3xl text-3xl font-extrabold leading-[1.05] tracking-tight text-blue-900 dark:text-blue-900-dark sm:text-5xl">
          {t("laborHubJobsHeroTitle")}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-blue-700 dark:text-blue-700-dark sm:text-lg">
          {t("laborHubJobsHeroLead")}
        </p>
      </div>

      <section className="mt-6 rounded-md bg-gray-0 px-6 py-8 dark:bg-gray-0-dark sm:px-9 sm:py-10">
        <JobsWall jobs={jobs} tickers={tickers} />
      </section>

      <div className="mt-6">
        <HubCtaCard />
      </div>
    </main>
  );
}
