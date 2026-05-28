"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef } from "react";

import { logError } from "@/utils/core/errors";

import { ShareCardPreview } from "./share_card_preview";
import { type WallYear } from "../helpers/wall_types";

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
  const cardRef = useRef<HTMLDivElement | null>(null);

  const tweetText = useMemo(() => {
    const value = forecasts["2035"];
    const sign =
      value != null && value < 0 ? "−" : value != null && value > 0 ? "+" : "";
    const pct =
      value == null ? "" : `${sign}${Math.abs(value).toFixed(0)}% by 2035`;
    return `${jobName}: ${pct} — Metaculus community forecast.\n${pageUrl}`;
  }, [forecasts, jobName, pageUrl]);

  const tweetIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const handleSave = useCallback(() => {
    const svg = cardRef.current?.querySelector("svg");
    if (!svg) return;
    try {
      // Clone + set explicit dimensions so the rasterized PNG is 1200×630.
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("width", "1200");
      clone.setAttribute("height", "630");
      const xml = new XMLSerializer().serializeToString(clone);
      const svgUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(xml)))}`;

      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = 1200 * scale;
        canvas.height = 630 * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, 1200, 630);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `metaculus-${slug}-2035.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        }, "image/png");
      };
      img.onerror = () => logError(new Error("share card image render failed"));
      img.src = svgUrl;
    } catch (err) {
      logError(err);
    }
  }, [slug]);

  return (
    <section className="rounded-md bg-gray-0 px-6 py-8 dark:bg-gray-0-dark sm:px-9 sm:py-10">
      <h3 className="m-0 text-lg font-semibold text-blue-900 dark:text-blue-900-dark">
        {t("laborHubJobsShareTitle")}
      </h3>
      <p className="mt-1 text-sm text-blue-700 dark:text-blue-700-dark">
        {t("laborHubJobsShareLead")}
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.91fr)_minmax(0,1fr)]">
        <div
          ref={cardRef}
          className="w-full overflow-hidden rounded-md shadow-sm"
        >
          <ShareCardPreview
            jobName={jobName}
            forecasts={forecasts}
            forecasterCount={forecasterCount}
          />
        </div>

        <div className="flex flex-col justify-end gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-md bg-blue-900 px-4 py-2 text-sm font-semibold text-gray-0 transition-colors hover:bg-blue-800 dark:bg-blue-900-dark dark:text-gray-0-dark dark:hover:bg-blue-800-dark"
          >
            {t("laborHubJobsShareSave")}
          </button>
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
    </section>
  );
}
