import { getTranslations } from "next-intl/server";

import {
  ContentParagraph,
  DualPaneSectionCard,
  DualPaneSectionLeft,
  DualPaneSectionRight,
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";
import { GroupTimelineMarker } from "@/components/charts/primitives/timeline_markers/types";
import { PostWithForecasts } from "@/types/post";

import { GhmQuestionCard } from "./ghm_question_card";
import {
  ProQuoteCallout,
  ProSummary,
  SectionProse,
  SourceSnapshotList,
} from "./section_blocks";
import { SectionCarousel } from "./section_carousel";
import { DISEASE_NAME_KEYS } from "../config/diseases";
import { getSectionLayout, SectionConfig } from "../config/sections";
import { SectionEdition } from "../editions/types";

export async function DiseaseSection({
  section,
  content,
  posts,
  editionLabel,
  markers,
  activeMarkerId,
}: {
  section: SectionConfig;
  content: SectionEdition | undefined;
  posts: Map<number, PostWithForecasts>;
  editionLabel: string;
  markers: GroupTimelineMarker[];
  activeMarkerId: string;
}) {
  const t = await getTranslations();
  const title = t(DISEASE_NAME_KEYS[section.id]);

  const cards = section.cards.map((card) => (
    <GhmQuestionCard
      key={card.postId}
      postId={card.postId}
      post={posts.get(card.postId)}
      values={card.values}
      markers={markers}
      activeMarkerId={activeMarkerId}
    />
  ));
  const prose = content ? (
    <SectionProse>{content.body}</SectionProse>
  ) : (
    <ContentParagraph>
      {t("globalHealthMonitorNotCovered", { date: editionLabel })}
    </ContentParagraph>
  );
  const sources = content?.sources?.length ? (
    <SourceSnapshotList sources={content.sources} />
  ) : null;
  const proSummary = content?.proSummary ? (
    <ProSummary>{content.proSummary}</ProSummary>
  ) : null;
  const quote = content?.quote ? (
    <ProQuoteCallout quote={content.quote} />
  ) : null;

  if (getSectionLayout(section) === "carousel") {
    return (
      <SectionCard id={section.id}>
        <SectionHeader>{title}</SectionHeader>
        <div className="mt-4 grid grid-cols-1 gap-6 md:mt-8 lg:grid-cols-2 lg:gap-8 print:grid-cols-2">
          <div className="flex flex-col gap-6">
            {prose}
            {sources}
          </div>
          {(proSummary || quote) && (
            <div className="flex flex-col gap-4">
              {proSummary}
              {quote}
            </div>
          )}
        </div>
        <SectionCarousel className="mt-6 md:mt-8">{cards}</SectionCarousel>
      </SectionCard>
    );
  }

  return (
    <DualPaneSectionCard id={section.id}>
      <DualPaneSectionLeft>
        <SectionHeader>{title}</SectionHeader>
        {prose}
        {sources}
        {proSummary}
      </DualPaneSectionLeft>
      <DualPaneSectionRight>
        {cards}
        {quote}
      </DualPaneSectionRight>
    </DualPaneSectionCard>
  );
}
