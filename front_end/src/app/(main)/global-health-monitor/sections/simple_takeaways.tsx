import { getTranslations } from "next-intl/server";

import {
  SectionCard,
  SectionHeader,
} from "@/app/(main)/labor-hub/components/section";

import { ChangeChip } from "../components/change_chip";
import { EditionSelector } from "../components/edition_selector";
import { DISEASE_NAME_KEYS } from "../config/diseases";
import { Edition } from "../editions/types";
import { GhmSnapshot } from "../helpers/snapshot";

// Report-style takeaways: a numbered two-column list without the linked chart.
export async function SimpleTakeawaysSection({
  edition,
  snapshot,
  latestSlug,
}: {
  edition: Edition;
  snapshot: GhmSnapshot;
  latestSlug: string;
}) {
  const t = await getTranslations();
  const since = snapshot.compareEdition?.label;

  const items = edition.takeaways.map((takeaway, index) => {
    const change = snapshot.values[takeaway.lead]?.change;
    return (
      <div
        key={takeaway.id}
        role="listitem"
        style={{ order: index }}
        className="flex break-inside-avoid gap-4"
      >
        <span
          aria-hidden
          className="w-9 shrink-0 font-serif text-3xl oldstyle-nums leading-none text-purple-600 dark:text-purple-600-dark md:text-4xl"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="my-0 text-lg font-bold leading-tight text-blue-800 dark:text-blue-800-dark md:text-xl">
              {takeaway.diseases
                .map((disease) => t(DISEASE_NAME_KEYS[disease]))
                .join(" · ")}
            </h3>
            {change && since && (
              <ChangeChip change={change} sinceLabel={since} />
            )}
          </div>
          <div className="text-base leading-relaxed text-blue-700 [text-wrap:pretty] dark:text-blue-700-dark md:text-lg">
            {takeaway.content}
          </div>
        </div>
      </div>
    );
  });
  // Masonry: takeaways alternate between two independent columns (1, 3, 5 | 2, 4), so a
  // tall one leaves no gap beside it. On one column the wrappers flatten (display:
  // contents) and `order` restores 1–5.
  const columns = [
    items.filter((_, index) => index % 2 === 0),
    items.filter((_, index) => index % 2 === 1),
  ];

  return (
    <SectionCard id="takeaways" className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeader>
          {t("globalHealthMonitorKeyTakeawaysTitle")}
        </SectionHeader>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <EditionSelector
            editions={snapshot.editions}
            currentSlug={edition.slug}
            latestSlug={latestSlug}
          />
        </div>
      </div>
      <div
        role="list"
        className="flex flex-col gap-8 md:grid md:grid-cols-2 md:items-start md:gap-x-12 print:grid print:grid-cols-2 print:items-start print:gap-x-12"
      >
        {columns.map((column, index) => (
          <div
            key={index}
            className="contents md:flex md:flex-col md:gap-8 print:flex print:flex-col print:gap-8"
          >
            {column}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
