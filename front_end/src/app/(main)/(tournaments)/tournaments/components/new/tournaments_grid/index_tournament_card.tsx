"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import { TournamentPreview } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getProjectLink } from "@/utils/navigation";

type Props = {
  item: TournamentPreview;
};

const IndexTournamentCard: React.FC<Props> = ({ item }) => {
  const t = useTranslations();
  const href = getProjectLink(item);

  const description = useMemo(() => {
    return htmlBoldToText(item.description_preview || "");
  }, [item.description_preview]);

  return (
    <Link
      href={href}
      className={cn(
        "group block no-underline",
        "rounded-lg border border-blue-400 dark:border-blue-400-dark lg:rounded",
        "bg-gray-0/50 dark:bg-gray-0-dark/50",
        "shadow-sm transition-shadow hover:shadow-md",
        "overflow-hidden antialiased"
      )}
    >
      <div className="relative h-[110px] w-full bg-blue-100/40 dark:bg-blue-100-dark/20 lg:h-[144px]">
        {item.header_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.header_image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      <div className="px-3 pb-4 pt-4 lg:px-4 lg:pb-6">
        <p className="my-0 text-center text-[10px] font-semibold uppercase text-blue-700/70 dark:text-blue-700-dark/70 lg:text-[12px]">
          {t.rich("tournamentQuestionsCountUpper", {
            count: item.questions_count ?? 0,
            n: (chunks) => (
              <span className="text-blue-800 dark:text-blue-800-dark">
                {chunks}
              </span>
            ),
          })}
        </p>

        <h6 className="mt-3 text-center text-[22px] font-semibold leading-[125%] text-blue-800 dark:text-blue-800-dark lg:text-[28px]">
          {item.name}
        </h6>

        {description ? (
          <p
            className={cn(
              "mx-auto my-0 mt-3 max-w-[25ch] text-center text-xs font-normal lg:text-base",
              "text-blue-700 dark:text-blue-700-dark",
              "line-clamp-4"
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </Link>
  );
};

function htmlBoldToText(html: string): string {
  const raw = (html ?? "").trim();
  if (!raw) return "";

  if (typeof window !== "undefined" && "DOMParser" in window) {
    const doc = new DOMParser().parseFromString(raw, "text/html");
    const boldNodes = doc.querySelectorAll("b, strong");
    const text = Array.from(boldNodes)
      .map((n) => (n.textContent || "").trim())
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return text;
  }

  const matches = raw.match(/<(b|strong)[^>]*>(.*?)<\/\1>/gis) ?? [];
  return matches
    .map((m) =>
      m
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join(" ")
    .trim();
}

export default IndexTournamentCard;
