import { getLocale, getTranslations } from "next-intl/server";
import { ReactNode } from "react";

import { ActivityCard } from "@/app/(main)/labor-hub/components/activity_card";

import { GHM_SOURCES } from "../config/sources";
import { ProCommentRef, SourceSnapshot } from "../editions/types";
import { formatEditionDate } from "../helpers/format";
import { getCommentHref } from "../helpers/links";

export async function SourceSnapshotList({
  sources,
}: {
  sources: SourceSnapshot[];
}) {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <div className="break-inside-avoid">
      <h3 className="mb-2 mt-0 text-sm font-medium uppercase tracking-wide text-olive-800 dark:text-olive-800-dark">
        {t("globalHealthMonitorLatestData")}
      </h3>
      <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
        {sources.map((snapshot) => {
          const source = GHM_SOURCES[snapshot.source];
          return (
            <li key={`${snapshot.source}-${snapshot.label}`}>
              <a
                href={snapshot.url ?? source.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-full flex-col gap-0.5 rounded border border-olive-400 bg-olive-100 px-3 py-2 text-gray-800 no-underline transition-colors hover:border-olive-600 dark:border-olive-400-dark dark:bg-olive-100-dark dark:text-gray-800-dark dark:hover:border-olive-600-dark"
              >
                <span className="text-lg font-bold leading-tight">
                  {snapshot.value}
                </span>
                <span className="text-xs leading-snug">{snapshot.label}</span>
                <span className="text-xs text-gray-600 dark:text-gray-600-dark">
                  {t("globalHealthMonitorSourceAsOf", {
                    source: source.name,
                    date: formatEditionDate(snapshot.asOf, locale),
                  })}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export async function ProSummary({ children }: { children: ReactNode }) {
  const t = await getTranslations();

  return (
    <div className="break-inside-avoid rounded-md border border-purple-300 bg-purple-100 p-4 dark:border-purple-300-dark dark:bg-purple-100-dark">
      <h3 className="mb-2 mt-0 text-sm font-medium uppercase tracking-wide text-purple-800 dark:text-purple-800-dark">
        {t("globalHealthMonitorProSummaryTitle")}
      </h3>
      <div className="text-sm text-purple-900 [text-wrap:pretty] dark:text-purple-900-dark md:text-base [&_p]:my-0">
        {children}
      </div>
    </div>
  );
}

export async function ProQuoteCallout({ quote }: { quote: ProCommentRef }) {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <ActivityCard
      username={quote.author}
      subtitle={t("globalHealthMonitorProForecaster")}
      date={formatEditionDate(quote.date, locale)}
      link={getCommentHref(quote)}
    >
      <span className="italic">“{quote.excerpt}”</span>
    </ActivityCard>
  );
}

export function SectionProse({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 text-base text-blue-700 [text-wrap:pretty] dark:text-blue-700-dark md:text-lg [&_p]:my-0">
      {children}
    </div>
  );
}
