import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getLocale, getTranslations } from "next-intl/server";
import { ReactNode } from "react";

import { ActivityCard } from "@/app/(main)/labor-hub/components/activity_card";
import cn from "@/utils/core/cn";

import { GHM_SOURCES } from "../config/sources";
import { ProCommentRef, SourceSnapshot } from "../editions/types";
import { formatIsoDate } from "../helpers/format";
import { getCommentHref } from "../helpers/links";

// External figures (cases, deaths) with their source and as-of date.
export async function LatestData({ sources }: { sources: SourceSnapshot[] }) {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <div className="break-inside-avoid rounded-md border border-blue-400 bg-blue-100 p-4 dark:border-blue-400-dark dark:bg-blue-100-dark md:p-5">
      <h3 className="mb-3 mt-0 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-700-dark md:mb-4">
        {t("globalHealthMonitorLatestData")}
      </h3>
      <ul
        className={cn(
          "m-0 grid list-none grid-cols-1 gap-x-6 gap-y-5 p-0",
          sources.length > 1 && "sm:grid-cols-2 print:grid-cols-2"
        )}
      >
        {sources.map((snapshot) => {
          const source = GHM_SOURCES[snapshot.source];
          return (
            <li
              key={`${snapshot.source}-${snapshot.label}`}
              className="flex min-w-0 flex-col gap-1.5"
            >
              <span className="text-3xl font-bold leading-none tracking-tight text-blue-800 dark:text-blue-800-dark md:text-4xl">
                {snapshot.value}
              </span>
              <span className="text-sm leading-snug text-blue-800 [text-wrap:pretty] dark:text-blue-800-dark">
                {snapshot.label}
              </span>
              <a
                href={snapshot.url ?? source.url}
                target="_blank"
                rel="noreferrer"
                className="self-start text-xs text-blue-600 underline decoration-blue-400 underline-offset-2 hover:text-blue-800 hover:decoration-blue-700 dark:text-blue-600-dark dark:decoration-blue-400-dark dark:hover:text-blue-800-dark dark:hover:decoration-blue-700-dark"
              >
                {t("globalHealthMonitorSourceAsOf", {
                  source: source.name,
                  date: formatIsoDate(snapshot.asOf, locale),
                })}
                <FontAwesomeIcon
                  icon={faArrowUpRightFromSquare}
                  className="ml-1 size-2.5 print:hidden"
                />
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
      date={formatIsoDate(quote.date, locale)}
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
