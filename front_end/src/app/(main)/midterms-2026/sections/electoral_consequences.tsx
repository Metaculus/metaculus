import { getTranslations } from "next-intl/server";

import {
  ContentParagraph,
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";

import ConsequenceGrid, {
  ConsequenceGridRow,
} from "../components/consequence_grid";
import {
  ConsequenceRow as ConsequenceRowData,
  MOCK_CONSEQUENCES,
} from "../data";

export default async function ElectoralConsequencesSection() {
  const t = await getTranslations();

  const ifRepLabel = t("midtermsHubConsequenceIfRep");
  const ifDemLabel = t("midtermsHubConsequenceIfDem");

  const rows: ConsequenceGridRow[] = MOCK_CONSEQUENCES.map((row) => ({
    key: row.questionKey,
    question: getQuestionText(row, t),
    repPct: row.repCongressPct,
    demPct: row.demCongressPct,
    ifRepLabel,
    ifDemLabel,
  }));

  return (
    <SectionCard>
      <SectionHeader className="mb-2">
        {t("midtermsHubElectoralConsequences")}
      </SectionHeader>
      <ContentParagraph className="mb-8">
        {t("midtermsHubConsequencesSubtitle")}
      </ContentParagraph>
      <ConsequenceGrid
        rows={rows}
        repHeader={{
          title: t("midtermsHubConsequenceHeaderRepTitle"),
          subtitle: t("midtermsHubConsequenceHeaderRepSubtitle"),
        }}
        demHeader={{
          title: t("midtermsHubConsequenceHeaderDemTitle"),
          subtitle: t("midtermsHubConsequenceHeaderDemSubtitle"),
        }}
      />
    </SectionCard>
  );
}

function getQuestionText(
  row: ConsequenceRowData,
  t: Awaited<ReturnType<typeof getTranslations>>
): string {
  switch (row.questionKey) {
    case "climate":
      return t("midtermsHubConsequenceClimate");
    case "minWage":
      return t("midtermsHubConsequenceMinWage");
    case "immigration":
      return t("midtermsHubConsequenceImmigration");
    case "shutdown":
      return t("midtermsHubConsequenceShutdown");
  }
}
