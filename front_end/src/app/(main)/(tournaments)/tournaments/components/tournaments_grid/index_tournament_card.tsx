"use client";

import { faList } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import { TournamentPreview } from "@/types/projects";
import cn from "@/utils/core/cn";

import TournamentCardShell from "./tournament_card_shell";

type Props = {
  item: TournamentPreview;
};

const IndexTournamentCard: React.FC<Props> = ({ item }) => {
  const t = useTranslations();

  const description = useMemo(() => {
    return htmlBoldToText(item.description_preview || "");
  }, [item.description_preview]);

  return (
    <TournamentCardShell item={item} className="antialiased">
      <div className="sm:hidden">
        <div className="flex items-center gap-4 p-1.5">
          <div
            className={cn(
              "relative h-[75px] w-[75px] shrink-0 overflow-hidden rounded",
              "bg-gray-0/50 dark:bg-gray-0-dark/50",
              "ring-1 ring-blue-400 dark:ring-blue-400-dark"
            )}
          >
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
              <div className="grid h-full w-full place-items-center bg-blue-400 dark:bg-blue-400-dark">
                <FontAwesomeIcon
                  icon={faList}
                  className="text-[20px] text-blue-600/30 dark:text-blue-600-dark/30"
                />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h6
              className={cn(
                "my-0",
                "text-[18px] font-semibold leading-[125%]",
                "text-blue-800 dark:text-blue-800-dark",
                "line-clamp-2 text-balance"
              )}
            >
              {item.name}
            </h6>

            <p className="sr-only">
              {t.rich("tournamentQuestionsCountUpper", {
                count: item.questions_count ?? 0,
                n: (chunks) => <>{chunks}</>,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="relative h-[110px] w-full bg-blue-100/40 dark:bg-blue-100-dark/20 lg:h-36">
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
            <div className="grid h-full w-full place-items-center bg-blue-400 dark:bg-blue-400-dark">
              <FontAwesomeIcon
                icon={faList}
                className="text-[24px] text-blue-600/30 dark:text-blue-600-dark/30 lg:text-[36px]"
              />
            </div>
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

          <h6 className="mt-3 text-balance text-center text-[22px] font-semibold leading-[125%] text-blue-800 dark:text-blue-800-dark lg:text-[28px]">
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
      </div>
    </TournamentCardShell>
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
