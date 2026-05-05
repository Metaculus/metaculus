import { getTranslations } from "next-intl/server";

import ConsequenceRow from "../components/consequence_row";
import { MOCK_CONSEQUENCES } from "../data";

export default async function ElectoralConsequencesSection() {
  const t = await getTranslations();
  return (
    <section className="pt-6">
      <div className="mb-4">
        <h2 className="m-0 text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-900-dark">
          {t("midtermsHubElectoralConsequences")}
        </h2>
      </div>
      <div className="rounded-xl border border-gray-300 bg-gray-0 p-5 dark:border-gray-300-dark dark:bg-gray-0-dark">
        <div className="hidden border-b border-gray-200 pb-3 dark:border-gray-200-dark md:grid md:grid-cols-[2fr_1fr_1fr] md:gap-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500-dark">
            {t("midtermsHubConsequenceQuestion")}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500-dark">
            {t("midtermsHubConsequenceIfRep")}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500-dark">
            {t("midtermsHubConsequenceIfDem")}
          </span>
        </div>
        {MOCK_CONSEQUENCES.map((row) => (
          <ConsequenceRow key={row.questionKey} row={row} />
        ))}
      </div>
    </section>
  );
}
