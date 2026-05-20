"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import cn from "@/utils/core/cn";

import { ShareCardPreview } from "./share_card_preview";
import { WALL_YEARS, type WallYear } from "../helpers/wall_types";

type Props = {
  slug: string;
  jobName: string;
  forecasts: Record<WallYear, number | null>;
  forecasterCount?: number | null;
  pageUrl: string;
};

export function ShareCard({
  slug,
  jobName,
  forecasts,
  forecasterCount,
  pageUrl,
}: Props) {
  const t = useTranslations();
  const [year, setYear] = useState<WallYear>("2035");

  const downloadUrl = useMemo(
    () => `/og/labor-hub/jobs/${slug}/route?year=${year}&download=1`,
    [slug, year]
  );

  const tweetText = useMemo(() => {
    const value = forecasts[year];
    const sign =
      value != null && value < 0 ? "−" : value != null && value > 0 ? "+" : "";
    const pct =
      value == null ? "" : `${sign}${Math.abs(value).toFixed(0)}% by ${year}`;
    return `${jobName}: ${pct} — Metaculus community forecast.\n${pageUrl}`;
  }, [forecasts, jobName, pageUrl, year]);

  const tweetIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  return (
    <section className="rounded-md bg-gray-0 px-6 py-8 dark:bg-gray-0-dark sm:px-9 sm:py-10">
      <h3 className="m-0 text-lg font-semibold text-blue-900 dark:text-blue-900-dark">
        {t("laborHubJobsShareTitle")}
      </h3>
      <p className="mt-1 text-sm text-blue-700 dark:text-blue-700-dark">
        {t("laborHubJobsShareLead")}
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.91fr)_minmax(0,1fr)]">
        <div className="aspect-[1.91/1] w-full overflow-hidden rounded-md shadow-sm">
          <ShareCardPreview
            jobName={jobName}
            forecasts={forecasts}
            forecasterCount={forecasterCount}
            year={year}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-700-dark">
              {t("laborHubJobsShareYearLabel")}
            </span>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-200 p-1 dark:bg-blue-200-dark">
              {WALL_YEARS.map((y) => (
                <button
                  key={y}
                  type="button"
                  aria-pressed={y === year}
                  onClick={() => setYear(y)}
                  className={cn(
                    "rounded-full px-3 py-1 font-jetbrains-mono text-sm font-medium transition-colors",
                    y === year
                      ? "bg-blue-900 text-gray-0 dark:bg-blue-900-dark dark:text-gray-0-dark"
                      : "text-blue-700 hover:text-blue-900 dark:text-blue-700-dark dark:hover:text-blue-900-dark"
                  )}
                >
                  {t("laborHubJobsShareYearOption", { year: y })}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={downloadUrl}
              download={`metaculus-${slug}-${year}.png`}
              className="inline-flex items-center justify-center rounded-md bg-blue-900 px-4 py-2 text-sm font-semibold text-gray-0 no-underline transition-colors hover:bg-blue-800 dark:bg-blue-900-dark dark:text-gray-0-dark dark:hover:bg-blue-800-dark"
            >
              {t("laborHubJobsShareSave")}
            </a>
            <a
              href={tweetIntent}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-blue-300 bg-gray-0 px-4 py-2 text-sm font-semibold text-blue-900 no-underline transition-colors hover:bg-blue-100 dark:border-blue-300-dark dark:bg-gray-0-dark dark:text-blue-900-dark dark:hover:bg-blue-100-dark"
            >
              {t("laborHubJobsShareTweet")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
