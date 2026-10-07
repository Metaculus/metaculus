import { getTranslations } from "next-intl/server";
import { ReactNode } from "react";

import {
  DualPaneSectionCard,
  DualPaneSectionLeft,
  DualPaneSectionRight,
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import { GhmQuestionCard } from "./ghm_question_card";
import {
  LatestData,
  ProQuoteCallout,
  ProSummary,
  SectionProse,
} from "./section_blocks";
import { SectionCarousel } from "./section_carousel";
import { DISEASE_NAME_KEYS } from "../config/diseases";
import { getSectionLayout, SectionConfig } from "../config/sections";
import { SectionEdition } from "../editions/types";

export async function DiseaseSection({
  section,
  content,
  posts,
}: {
  section: SectionConfig;
  content: SectionEdition | undefined;
  posts: Map<number, PostWithForecasts>;
}) {
  const t = await getTranslations();
  const title = t(DISEASE_NAME_KEYS[section.id]);
  const layout = getSectionLayout(section);

  const cards = section.cards.map((card) => (
    <GhmQuestionCard
      key={card.postId}
      postId={card.postId}
      post={posts.get(card.postId)}
      value={card.value}
    />
  ));

  // Side-by-side columns are a title and a chart, with no edition text.
  if (layout === "column") {
    return (
      <div id={section.id} className="flex min-w-0 flex-col gap-4 md:gap-6">
        <SectionHeader className="md:text-2xl">{title}</SectionHeader>
        {cards}
      </div>
    );
  }

  const prose = content ? <SectionProse>{content.body}</SectionProse> : null;
  const latestData = content?.sources?.length ? (
    <LatestData sources={content.sources} />
  ) : null;
  const proSummary = content?.proSummary ? (
    <ProSummary>{content.proSummary}</ProSummary>
  ) : null;
  const quote = content?.quote ? (
    <ProQuoteCallout quote={content.quote} />
  ) : null;

  if (layout === "carousel") {
    const hasAside = latestData || proSummary || quote;
    return (
      <SectionCard id={section.id}>
        <SectionHeader>{title}</SectionHeader>
        <div className="mt-4 grid grid-cols-1 gap-6 md:mt-8 lg:grid-cols-2 lg:gap-8 print:grid-cols-2">
          {prose}
          {hasAside && (
            <div className="flex min-w-0 flex-col gap-4">
              {latestData}
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
        {proSummary}
      </DualPaneSectionLeft>
      <div className="flex min-w-0 flex-col gap-6">
        {latestData}
        <DualPaneSectionRight>
          {cards}
          {quote}
        </DualPaneSectionRight>
      </div>
    </DualPaneSectionCard>
  );
}

// Side-by-side "column" sections share one card.
export function DiseaseSectionRow({
  columns,
  children,
}: {
  columns: number;
  children: ReactNode;
}) {
  return (
    <SectionCard
      className={cn(
        "grid grid-cols-1 gap-10 lg:gap-8 print:gap-6",
        columns >= 3
          ? "lg:grid-cols-3 print:grid-cols-3"
          : "lg:grid-cols-2 print:grid-cols-2"
      )}
    >
      {children}
    </SectionCard>
  );
}
