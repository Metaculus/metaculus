"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

import type { LeaderboardDetails } from "@/types/scoring";
import cn from "@/utils/core/cn";

import {
  entryIconPair,
  entryLabel,
  shouldDisplayEntry,
} from "./leaderboard/utils";
import { LightDarkIcon } from "./light-dark-icon";

// Mock translation function for entryLabel - returns hardcoded English values
const mockTranslate = ((key: string) => {
  const translations: Record<string, string> = {
    communityPrediction: "Community Prediction",
    aibLegendPros: "Pro Forecasters",
  };
  return translations[key] ?? key;
}) as ReturnType<typeof import("next-intl").useTranslations>;

type Props = { details: LeaderboardDetails };

const FutureEvalLeaderboardTable: React.FC<Props> = ({ details }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);

  const rows = useMemo(() => {
    const entries = (details.entries ?? [])
      .filter((e) => shouldDisplayEntry(e))
      .map((entry, i) => {
        const label = entryLabel(entry, mockTranslate);
        const icons = entryIconPair(entry);
        const userId = entry.user?.id;
        const id = String(userId ?? label);
        return {
          id,
          rank: i + 1,
          label,
          username: entry.user?.username ?? "",
          icons,
          forecasts: Math.round((entry.contribution_count ?? 0) * 1000) / 1000,
          score: entry.score,
          ciLower: entry.ci_lower,
          ciUpper: entry.ci_upper,
          profileHref: userId ? `/accounts/profile/${userId}/` : null,
          isAggregate: !entry.user?.username,
        };
      });

    return entries;
  }, [details.entries]);

  // Scroll to and flash highlighted row - depends on rows so it runs after entries are populated
  useEffect(() => {
    if (highlightId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightId, rows]);

  const hasCI = rows.some((r) => r.ciLower != null || r.ciUpper != null);

  return (
    <table className="mx-auto w-full table-fixed border-collapse border-spacing-0 border-[1px] border-gray-300 dark:border-gray-300-dark">
      <colgroup>
        <col className="w-8 sm:w-16" />
        <col />
        <col className="hidden w-[100px] sm:table-cell" />
        <col className="w-[100px]" />
        {hasCI && (
          <>
            <col className="hidden w-[120px] md:table-cell" />
            <col className="hidden w-[120px] md:table-cell" />
          </>
        )}
      </colgroup>

      <thead>
        <tr className="items-center border-b-[1px] border-blue-400 bg-futureeval-bg-light text-gray-500 dark:border-blue-400-dark dark:bg-futureeval-bg-dark dark:text-gray-500-dark">
          <Th />
          <Th>Model</Th>
          <Th className="hidden text-center sm:table-cell">Forecasts</Th>
          <Th className="w-[100px] text-center">Avg Score</Th>
          {hasCI && (
            <>
              <Th className="hidden w-[120px] text-center md:table-cell">
                95% CI lower
              </Th>
              <Th className="hidden w-[120px] text-center md:table-cell">
                95% CI higher
              </Th>
            </>
          )}
        </tr>
      </thead>

      <tbody className="bg-futureeval-bg-light dark:bg-futureeval-bg-dark">
        {rows.map((r, i) => {
          const isHighlighted = highlightId === r.id;
          const profileHref = r.profileHref;
          const isClickable = !r.isAggregate && profileHref;

          const handleRowKeyDown = (e: React.KeyboardEvent) => {
            if (
              isClickable &&
              (e.key === "Enter" || e.key === " " || e.key === "Spacebar")
            ) {
              e.preventDefault();
              router.push(profileHref);
            }
          };

          return (
            <tr
              key={`${r.username}-${r.rank}`}
              ref={isHighlighted ? highlightedRowRef : null}
              onClick={isClickable ? () => router.push(profileHref) : undefined}
              onKeyDown={handleRowKeyDown}
              tabIndex={isClickable ? 0 : -1}
              role={isClickable ? "button" : undefined}
              className={cn(
                "h-[61px] border-b border-gray-300 last:border-0 dark:border-gray-300-dark",
                isHighlighted && "animate-highlight-flash",
                isClickable &&
                  "cursor-pointer hover:bg-futureeval-primary-light/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-futureeval-primary-light dark:hover:bg-futureeval-primary-dark/10 dark:focus-visible:ring-futureeval-primary-dark"
              )}
            >
              <Td className="text-center tabular-nums">{i + 1}</Td>

              <Td>
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  {(r.icons.light || r.icons.dark) && (
                    <LightDarkIcon
                      className="shrink-0"
                      alt={r.label}
                      light={r.icons.light}
                      dark={r.icons.dark}
                      sizePx="20px"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm leading-[24px] sm:text-base">
                      {r.label}
                    </div>
                    <div className="truncate text-[10px] text-gray-500 dark:text-gray-500-dark sm:text-xs">
                      {r.username}
                    </div>
                  </div>
                </div>
              </Td>

              <Td className="hidden text-center tabular-nums sm:table-cell">
                {r.forecasts}
              </Td>
              <Td className="w-[100px] text-center tabular-nums">
                {fmt(r.score, 2)}
              </Td>

              {hasCI && (
                <>
                  <Td className="hidden text-center tabular-nums md:table-cell">
                    {fmt(r.ciLower, 2)}
                  </Td>
                  <Td className="hidden text-center tabular-nums md:table-cell">
                    {fmt(r.ciUpper, 2)}
                  </Td>
                </>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const fmt = (n: number | null | undefined, d = 2) =>
  n == null || Number.isNaN(n) ? "—" : n.toFixed(d);

const Th: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({
  className = "",
  children,
}) => (
  <th
    className={`text-nowrap px-4 py-[10px] text-left text-sm font-bold leading-[16px] text-gray-500 antialiased dark:text-gray-500-dark ${className}`}
  >
    {children}
  </th>
);

const Td: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({
  className = "",
  children,
}) => (
  <td
    className={`px-4 py-[10px] text-sm leading-[16px] text-gray-800 dark:text-gray-800-dark ${className}`}
  >
    {children}
  </td>
);

export default FutureEvalLeaderboardTable;
