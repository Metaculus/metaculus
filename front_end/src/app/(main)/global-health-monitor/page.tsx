import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import LaborHubNavigation from "@/app/(main)/labor-hub/components/labor_hub_navigation";
import { HubPdf } from "@/app/(main)/labor-hub/components/pdf_download_button";
import { PrintAttribution } from "@/app/(main)/labor-hub/components/print_attribution";
import { SearchParams } from "@/types/navigation";
import cn from "@/utils/core/cn";
import { getPublicSettings } from "@/utils/public_settings.server";

import { CloserLookTabs } from "./components/closer_look_tabs";
import {
  DiseaseSection,
  DiseaseSectionRow,
} from "./components/disease_section";
import { GhmDataProvider } from "./components/ghm_data_provider";
import { ModeSwitcher } from "./components/mode_switcher";
import { DISEASE_NAME_KEYS } from "./config/diseases";
import { GHM_ROUTE } from "./config/season";
import { getSectionRows, SectionConfig, SECTIONS } from "./config/sections";
import {
  EDITIONS,
  getLatestEdition,
  getPreviousEdition,
  resolveEdition,
} from "./editions";
import { formatEditionLabel } from "./helpers/format";
import { fetchGhmPosts } from "./helpers/ghm_posts";
import { getGhmQuery, parseGhmMode } from "./helpers/mode";
import { buildGhmSnapshot } from "./helpers/snapshot";
import { EngagementSection } from "./sections/engagement";
import { HeroSection } from "./sections/hero";
import { KeyTakeawaysSection } from "./sections/key_takeaways";
import { MethodologySection } from "./sections/methodology";
import { SimpleTakeawaysSection } from "./sections/simple_takeaways";

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

export default async function GlobalHealthMonitorPage({ searchParams }: Props) {
  const t = await getTranslations();
  const locale = await getLocale();
  const params = await searchParams;
  const mode = parseGhmMode(params.mode);
  const latest = getLatestEdition();
  const edition = resolveEdition(getParam(params, "edition"));
  const posts = await fetchGhmPosts();
  const snapshot = buildGhmSnapshot({
    posts,
    editions: EDITIONS,
    edition,
    previousEdition: getPreviousEdition(edition),
    isLatest: edition.slug === latest.slug,
    locale,
  });
  const pdf: HubPdf = {
    url: `${GHM_ROUTE}pdf/${getGhmQuery({
      edition: snapshot.isLatest ? null : edition.slug,
      mode,
    })}`,
    fileName: `global-health-monitor-${edition.slug}.pdf`,
  };
  const latestHref = `${GHM_ROUTE}${getGhmQuery({ edition: null, mode })}`;

  const renderSection = (section: SectionConfig) => (
    <DiseaseSection
      key={section.id}
      section={section}
      content={edition.sections[section.id]}
      posts={posts}
    />
  );
  // A row is one full section, or several small ones side by side.
  const sectionRows = getSectionRows(SECTIONS).map((row) =>
    row.kind === "section"
      ? {
          id: row.section.id,
          label: t(DISEASE_NAME_KEYS[row.section.id]),
          aliases: [],
          content: renderSection(row.section),
        }
      : {
          id: row.sections.map((section) => section.id).join("-"),
          label: t("globalHealthMonitorOtherDiseases"),
          aliases: row.sections.map((section) => section.id),
          content: (
            <DiseaseSectionRow
              key={row.sections.map((section) => section.id).join("-")}
              columns={row.sections.length}
            >
              {row.sections.map(renderSection)}
            </DiseaseSectionRow>
          ),
        }
  );

  const contentClassName =
    "mx-auto flex w-full max-w-7xl flex-col gap-5 px-1 sm:gap-6 sm:px-8 md:gap-8 xl:px-16 print:gap-8 print:px-0";
  const blockSpacingClassName = "mt-5 sm:mt-6 md:mt-8 print:mt-8";
  const trailingSections = (
    <>
      <MethodologySection />
      <PrintAttribution />
      <EngagementSection />
    </>
  );

  return (
    <main className="relative mb-24 min-h-screen xl:mt-12 print:mb-0 print:mt-0 print:[zoom:0.75] [&_[id]]:scroll-mt-24">
      <GhmDataProvider snapshot={snapshot}>
        <div className="mx-auto w-full max-w-7xl xl:px-16 print:mb-6 print:px-0">
          <ModeSwitcher mode={mode} />
          <HeroSection latestSlug={latest.slug} mode={mode} pdf={pdf} />
        </div>
        {mode === "simple" ? (
          <>
            <div className={cn(contentClassName, blockSpacingClassName)}>
              <SimpleTakeawaysSection
                edition={edition}
                snapshot={snapshot}
                latestSlug={latest.slug}
              />
            </div>
            {/* Outside the content column so the sticky tab bar spans the viewport. */}
            <div className={blockSpacingClassName}>
              <CloserLookTabs
                id="closer-look"
                title={t("globalHealthMonitorCloserLook")}
                tabs={sectionRows.map(({ id, label, aliases, content }) => ({
                  id,
                  label,
                  aliases,
                  panel: content,
                }))}
              />
            </div>
            <div className={cn(contentClassName, blockSpacingClassName)}>
              {trailingSections}
            </div>
          </>
        ) : (
          <>
            <LaborHubNavigation
              sections={[
                {
                  id: "takeaways",
                  label: t("globalHealthMonitorNavTakeaways"),
                },
                ...SECTIONS.map((section) => ({
                  id: section.id,
                  label: t(DISEASE_NAME_KEYS[section.id]),
                })),
                {
                  id: "methodology",
                  label: t("globalHealthMonitorNavMethodology"),
                },
              ]}
              pdf={null}
              showNewsletter={false}
            />
            <div className={contentClassName}>
              <KeyTakeawaysSection
                edition={edition}
                snapshot={snapshot}
                latestSlug={latest.slug}
                latestHref={latestHref}
                posts={posts}
              />
              {sectionRows.map((row) => row.content)}
              {trailingSections}
            </div>
          </>
        )}
      </GhmDataProvider>
    </main>
  );
}
