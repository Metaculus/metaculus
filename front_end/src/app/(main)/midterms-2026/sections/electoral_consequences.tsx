import { getTranslations } from "next-intl/server";

import {
  ContentParagraph,
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";

import ConsequenceGrid, {
  ConsequenceGridRow,
} from "../components/consequence_grid";
import { fetchConsequenceConditionals } from "../helpers/fetch_dashboard_data";

export default async function ElectoralConsequencesSection() {
  const t = await getTranslations();
  const conditionals = await fetchConsequenceConditionals();

  const ifDemLabel = t("midtermsHubConsequenceIfDem");
  const ifSplitLabel = t("midtermsHubConsequenceIfSplit");
  const ifRepLabel = t("midtermsHubConsequenceIfRep");

  const rows: ConsequenceGridRow[] = conditionals.map((c) => ({
    key: String(c.id),
    question: c.title,
    demPct: c.demPct,
    splitPct: c.splitPct,
    repPct: c.repPct,
    ifDemLabel,
    ifSplitLabel,
    ifRepLabel,
  }));

  if (!rows.length) return null;

  // Lead slot for col 1 of the grid header — sits offset to the left of
  // the colored party cards, matching the reference layout.
  const leadingSlot = (
    <>
      <SectionHeader className="mb-2">
        {t("midtermsHubElectoralConsequences")}
      </SectionHeader>
      <ContentParagraph small className="max-w-sm">
        {t("midtermsHubConsequencesSubtitle")}
      </ContentParagraph>
    </>
  );

  return (
    <SectionCard>
      <ConsequenceGrid
        leadingSlot={leadingSlot}
        rows={rows}
        demHeader={{
          title: t("midtermsHubConsequenceHeaderDemTitle"),
          subtitle: t("midtermsHubConsequenceHeaderDemSubtitle"),
        }}
        splitHeader={{
          title: t("midtermsHubConsequenceHeaderSplitTitle"),
          subtitle: t("midtermsHubConsequenceHeaderSplitSubtitle"),
        }}
        repHeader={{
          title: t("midtermsHubConsequenceHeaderRepTitle"),
          subtitle: t("midtermsHubConsequenceHeaderRepSubtitle"),
        }}
      />
    </SectionCard>
  );
}
