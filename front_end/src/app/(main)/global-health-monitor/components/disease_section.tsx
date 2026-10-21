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
import { DISEASE_NAME_KEYS, DiseaseId } from "../config/diseases";
import { OTHER_DISEASES_ID, SectionConfig } from "../config/sections";
import { SectionEdition } from "../editions/types";

export async function DiseaseSection({
  section,
  content,
  posts,
  asOfTime,
}: {
  section: SectionConfig;
  content: SectionEdition | undefined;
  posts: Map<number, PostWithForecasts>;
  asOfTime?: number;
}) {
  const t = await getTranslations();
  const title = t(DISEASE_NAME_KEYS[section.id]);
  const cpLabel =
    asOfTime === undefined
      ? undefined
      : t("globalHealthMonitorForecastAtPublication");

  // Columns of the "Other emerging diseases" row are their cards alone, opened on the timeline.
  const isColumn = section.layout === "column";
  const cards = section.cards.map((card) => (
    <GhmQuestionCard
      key={card.postId}
      postId={card.postId}
      post={posts.get(card.postId)}
      value={card.value}
      asOfTime={asOfTime}
      cpLabel={cpLabel}
      startOnTimeline={isColumn}
    />
  ));

  if (isColumn) {
    return <div className="flex min-w-0 flex-col gap-4 md:gap-6">{cards}</div>;
  }

  return (
    <DualPaneSectionCard id={section.id}>
      <DualPaneSectionLeft>
        <SectionHeader>{title}</SectionHeader>
        {content && <SectionProse>{content.body}</SectionProse>}
        {content?.proSummary && <ProSummary>{content.proSummary}</ProSummary>}
        {!!content?.sources?.length && <LatestData sources={content.sources} />}
      </DualPaneSectionLeft>
      <DualPaneSectionRight>
        {cards}
        {content?.quote && <ProQuoteCallout quote={content.quote} />}
      </DualPaneSectionRight>
    </DualPaneSectionCard>
  );
}

export async function DiseaseSectionRow({
  diseases,
  children,
}: {
  diseases: DiseaseId[];
  children: ReactNode;
}) {
  const t = await getTranslations();

  return (
    <SectionCard id={OTHER_DISEASES_ID}>
      {/* Each disease's own anchor (prose links) lands on the whole row, below the sticky nav. */}
      {diseases.map((disease) => (
        <span
          key={disease}
          id={disease}
          className="block !scroll-mt-44"
          aria-hidden
        />
      ))}
      <SectionHeader>
        {t("globalHealthMonitorOtherEmergingDiseases")}
      </SectionHeader>
      <div
        className={cn(
          "mt-6 grid grid-cols-1 gap-10 md:mt-8 lg:gap-8 print:grid-cols-2 print:gap-6",
          diseases.length > 1 && "md:grid-cols-2"
        )}
      >
        {children}
      </div>
    </SectionCard>
  );
}
