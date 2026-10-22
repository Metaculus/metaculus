import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import LaborHubNavigation from "@/app/(main)/labor-hub/components/labor_hub_navigation";
import { HubPdf } from "@/app/(main)/labor-hub/components/pdf_download_button";
import { PrintAttribution } from "@/app/(main)/labor-hub/components/print_attribution";
import { SearchParams } from "@/types/navigation";
import { PostWithForecasts } from "@/types/post";
import { getPublicSettings } from "@/utils/public_settings.server";

import { EditionLoading } from "./components/edition_loading";
import { EditionNavChip } from "./components/edition_status";
import { GhmDataProvider } from "./components/ghm_data_provider";
import { PastEditionBanner } from "./components/past_edition_banner";
import { DISEASE_NAME_KEYS } from "./config/diseases";
import { GHM_ROUTE } from "./config/season";
import {
  getSectionRows,
  OTHER_DISEASES_ID,
  SectionConfig,
} from "./config/sections";
import {
  EDITIONS,
  getLatestEdition,
  getPreviousEdition,
  resolveEdition,
} from "./editions";
import { formatEditionLabel } from "./helpers/format";
import { fetchGhmPosts } from "./helpers/ghm_posts";
import { getEditionQuery } from "./helpers/links";
import { buildGhmSnapshot } from "./helpers/snapshot";
import { hadOpenedBy, snapshotPostsAt } from "./helpers/snapshot_posts";
import { EditionBody, PastEditionBody } from "./sections/edition_body";
import { EngagementSection } from "./sections/engagement";
import { HeroSection } from "./sections/hero";
import { MethodologySection } from "./sections/methodology";

type Props = { searchParams: Promise<SearchParams> };

function getParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const t = await getTranslations();
  const locale = await getLocale();
  const { PUBLIC_APP_URL } = getPublicSettings();
  const title = t("globalHealthMonitorMetaTitle");
  const description = t("globalHealthMonitorMetaDescription");
  const edition = resolveEdition(getParam(await searchParams, "edition"));
  const isLatest = edition.slug === getLatestEdition().slug;
  const img = `${PUBLIC_APP_URL}/og/global-health-monitor/route?theme=dark`;

  return {
    title: isLatest
      ? title
      : t("globalHealthMonitorMetaTitleEdition", {
          date: formatEditionLabel(edition.slug, locale),
        }),
    description,
    alternates: { canonical: `${PUBLIC_APP_URL}${GHM_ROUTE}` },
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

// A past edition's layout as published: without the cards whose question only opened after
// asOf (seconds), e.g. one added while the edition was live.
function getPublishedLayout(
  layout: SectionConfig[],
  livePosts: Map<number, PostWithForecasts>,
  asOf: number
): SectionConfig[] {
  return layout
    .map((section) => ({
      ...section,
      cards: section.cards.filter(({ postId }) => {
        const post = livePosts.get(postId);
        return !post || hadOpenedBy(post, asOf);
      }),
    }))
    .filter((section) => section.cards.length > 0);
}

export default async function GlobalHealthMonitorPage({ searchParams }: Props) {
  const t = await getTranslations();
  const locale = await getLocale();
  const latest = getLatestEdition();
  const edition = resolveEdition(getParam(await searchParams, "edition"));
  const isLatest = edition.slug === latest.slug;
  const livePosts = await fetchGhmPosts();

  // Only the latest edition is live. Past ones show everything as of publication; their curves
  // load in `PastEditionBody`, and nothing above it needs them.
  const asOfTime = isLatest ? undefined : Date.parse(edition.asOf);
  const asOf = asOfTime === undefined ? undefined : Math.floor(asOfTime / 1000);
  const layout =
    asOf === undefined
      ? edition.layout
      : getPublishedLayout(edition.layout, livePosts, asOf);
  const posts =
    asOf === undefined ? livePosts : snapshotPostsAt(livePosts, asOf, {});

  const snapshot = buildGhmSnapshot({
    posts,
    editions: EDITIONS,
    edition,
    previousEdition: getPreviousEdition(edition),
    isLatest,
    locale,
  });
  const pdf: HubPdf = {
    url: `${GHM_ROUTE}pdf/${getEditionQuery(isLatest ? null : edition.slug)}`,
    fileName: `global-health-monitor-${edition.slug}.pdf`,
  };

  // A nav pill per row: one per full section, one for all the small ones side by side.
  const navRows = getSectionRows(layout).map((row) =>
    row.kind === "section"
      ? { id: row.section.id, label: t(DISEASE_NAME_KEYS[row.section.id]) }
      : { id: OTHER_DISEASES_ID, label: t("globalHealthMonitorOtherDiseases") }
  );

  return (
    <main className="relative mb-24 min-h-screen xl:mt-12 print:mb-0 print:mt-0 print:[zoom:0.75] [&_[id]]:scroll-mt-24">
      <GhmDataProvider snapshot={snapshot}>
        <div className="mx-auto w-full max-w-7xl xl:px-16 print:mb-6 print:px-0">
          <HeroSection snapshot={snapshot} latestSlug={latest.slug} pdf={pdf} />
        </div>
        <LaborHubNavigation
          sections={[
            { id: "takeaways", label: t("globalHealthMonitorNavTakeaways") },
            ...navRows,
            {
              id: "methodology",
              label: t("globalHealthMonitorNavMethodology"),
            },
          ]}
          pdf={null}
          showNewsletter={false}
          actions={
            isLatest ? undefined : <EditionNavChip edition={snapshot.edition} />
          }
        />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-1 sm:gap-6 sm:px-8 md:gap-8 xl:px-16 print:gap-8 print:px-0">
          {asOfTime === undefined ? (
            <EditionBody edition={edition} layout={layout} posts={posts} />
          ) : (
            <>
              <PastEditionBanner
                date={snapshot.edition.label}
                href={GHM_ROUTE}
              />
              <Suspense
                key={edition.slug}
                fallback={
                  <EditionLoading
                    message={t("globalHealthMonitorLoadingEdition", {
                      date: snapshot.edition.label,
                    })}
                  />
                }
              >
                <PastEditionBody
                  edition={edition}
                  layout={layout}
                  livePosts={livePosts}
                  asOfTime={asOfTime}
                />
              </Suspense>
            </>
          )}
          <MethodologySection />
          <PrintAttribution />
          <EngagementSection />
        </div>
      </GhmDataProvider>
    </main>
  );
}
