import { getTranslations } from "next-intl/server";

import {
  ContentParagraph,
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";

import ConsequenceRow from "../components/consequence_row";
import { MOCK_CONSEQUENCES } from "../data";

export default async function ElectoralConsequencesSection() {
  const t = await getTranslations();
  return (
    <SectionCard>
      <SectionHeader className="mb-2">
        {t("midtermsHubElectoralConsequences")}
      </SectionHeader>
      <ContentParagraph className="mb-8">
        {t("midtermsHubConsequencesSubtitle")}
      </ContentParagraph>
      <div className="rounded-md border border-blue-300 bg-blue-100 p-3 dark:border-blue-300-dark dark:bg-blue-100-dark sm:p-5">
        <div className="hidden border-b border-blue-300 pb-3 dark:border-blue-300-dark md:grid md:grid-cols-[2fr_1fr_1fr] md:gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-700-dark">
            {t("midtermsHubConsequenceQuestion")}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-700-dark">
            {t("midtermsHubConsequenceIfRep")}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-700-dark">
            {t("midtermsHubConsequenceIfDem")}
          </span>
        </div>
        {MOCK_CONSEQUENCES.map((row) => (
          <ConsequenceRow key={row.questionKey} row={row} />
        ))}
      </div>
    </SectionCard>
  );
}
