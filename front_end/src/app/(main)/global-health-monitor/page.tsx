import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import LaborHubNavigation from "@/app/(main)/labor-hub/components/labor_hub_navigation";
import { PrintAttribution } from "@/app/(main)/labor-hub/components/print_attribution";
import { SearchParams } from "@/types/navigation";
import { getPublicSettings } from "@/utils/public_settings.server";

import { DiseaseSection } from "./components/disease_section";
import { GhmDataProvider } from "./components/ghm_data_provider";
import { DISEASE_NAME_KEYS } from "./config/diseases";
import { GHM_ROUTE } from "./config/season";
import { SECTIONS } from "./config/sections";
import {
  EDITIONS,
  getLatestEdition,
  getPreviousEdition,
  NEXT_EDITION_ON,
  resolveEdition,
} from "./editions";
import { toTimelineMarkers } from "./helpers/edition_markers";
import { formatEditionDate } from "./helpers/format";
import { fetchGhmPosts } from "./helpers/ghm_posts";
import { buildGhmSnapshot } from "./helpers/snapshot";
import { EngagementSection } from "./sections/engagement";
import { HeroSection } from "./sections/hero";
import { KeyTakeawaysSection } from "./sections/key_takeaways";
import { MethodologySection } from "./sections/methodology";

type Props = { searchParams: Promise<SearchParams> };

function getEditionParam(searchParams: SearchParams) {
  const value = searchParams.edition;
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
  const edition = resolveEdition(getEditionParam(await searchParams));
  const isLatest = edition.slug === getLatestEdition().slug;
  const img = `${PUBLIC_APP_URL}/og/global-health-monitor/route?theme=dark`;

  return {
    title: isLatest
      ? title
      : t("globalHealthMonitorMetaTitleEdition", {
          date: formatEditionDate(edition.slug, locale),
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

export default async function GlobalHealthMonitorPage({ searchParams }: Props) {
  const t = await getTranslations();
  const locale = await getLocale();
  const latest = getLatestEdition();
  const edition = resolveEdition(getEditionParam(await searchParams));
  const posts = await fetchGhmPosts();
  const snapshot = buildGhmSnapshot({
    posts,
    editions: EDITIONS,
    edition,
    previousEdition: getPreviousEdition(edition),
    isLatest: edition.slug === latest.slug,
    locale,
  });
  const markers = toTimelineMarkers(snapshot.editionMarkers);

  const navSections = [
    { id: "takeaways", label: t("globalHealthMonitorNavTakeaways") },
    ...SECTIONS.map((section) => ({
      id: section.id,
      label: t(DISEASE_NAME_KEYS[section.id]),
    })),
    { id: "methodology", label: t("globalHealthMonitorNavMethodology") },
  ];

  return (
    <main className="relative mb-24 min-h-screen xl:mt-12 print:mb-0 print:mt-0 print:[zoom:0.75] [&_[id]]:scroll-mt-24">
      <GhmDataProvider snapshot={snapshot}>
        <div className="mx-auto w-full max-w-7xl xl:px-16 print:mb-6 print:px-0">
          <HeroSection
            latestSlug={latest.slug}
            nextEditionOn={NEXT_EDITION_ON}
          />
        </div>
        <LaborHubNavigation
          sections={navSections}
          pdf={{
            url: snapshot.isLatest
              ? `${GHM_ROUTE}pdf/`
              : `${GHM_ROUTE}pdf/?edition=${edition.slug}`,
            fileName: `global-health-monitor-${edition.slug}.pdf`,
          }}
          showNewsletter={false}
        />
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-1 sm:gap-6 sm:px-8 md:gap-8 xl:px-16 print:gap-8 print:px-0">
          <KeyTakeawaysSection
            edition={edition}
            snapshot={snapshot}
            latestSlug={latest.slug}
            posts={posts}
          />
          {SECTIONS.map((section) => (
            <DiseaseSection
              key={section.id}
              section={section}
              content={edition.sections[section.id]}
              posts={posts}
              editionLabel={snapshot.edition.label}
              markers={markers}
              activeMarkerId={edition.slug}
            />
          ))}
          <MethodologySection />
          <PrintAttribution />
          <EngagementSection />
        </div>
      </GhmDataProvider>
    </main>
  );
}
