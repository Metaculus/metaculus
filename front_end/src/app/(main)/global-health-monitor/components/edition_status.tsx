import { getTranslations } from "next-intl/server";

import LiveBadge from "@/app/(main)/midterms-2026/components/live_badge";
import cn from "@/utils/core/cn";

import { EditionLabel } from "../helpers/snapshot";

const snapshotChipClassName =
  "inline-flex items-center whitespace-nowrap rounded-full border border-purple-400 bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:border-purple-400-dark dark:bg-purple-100-dark dark:text-purple-800-dark";

// The latest edition is live; past ones are a snapshot of their publication day, which the nav
// chip and banner point out.
export async function EditionStatus({
  edition,
  isLatest,
}: {
  edition: EditionLabel;
  isLatest: boolean;
}) {
  const t = await getTranslations();

  return (
    <div className="flex shrink-0 flex-col gap-1 text-sm text-blue-700 dark:text-blue-700-dark sm:items-end">
      {isLatest && <LiveBadge label={t("globalHealthMonitorLiveBadge")} />}
      <span className={cn(isLatest && "text-xs opacity-50")}>
        {t("globalHealthMonitorPublishedOn", { date: edition.published })}
      </span>
    </div>
  );
}

// Keeps a past edition recognisable in the sticky nav while scrolling.
export async function EditionNavChip({ edition }: { edition: EditionLabel }) {
  const t = await getTranslations();

  return (
    <span
      className={snapshotChipClassName}
      title={t("globalHealthMonitorPastEditionBanner", { date: edition.label })}
    >
      {edition.abbreviatedLabel}
      <span className="hidden sm:inline">
        &nbsp;· {t("globalHealthMonitorSnapshot")}
      </span>
    </span>
  );
}
