"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import type { LeaderboardDetails } from "@/types/scoring";

import { LightDarkIcon } from "../light-dark-icon";
import { entryIconPair, entryLabel, shouldDisplayEntry } from "./utils";

type Props = { details: LeaderboardDetails };

const AIBLeaderboardTable: React.FC<Props> = ({ details }) => {
  const t = useTranslations();

  const rows = useMemo(() => {
    const entries = (details.entries ?? [])
      .filter((e) => shouldDisplayEntry(e))
      .map((entry, i) => {
        const label = entryLabel(entry, t);
        const icons = entryIconPair(entry);
        const userId = entry.user?.id;
        return {
          rank: i + 1,
          label,
          username: entry.user?.username ?? "",
          icons,
          forecasts: Math.round((entry.contribution_count ?? 0) * 1000) / 1000,
          score: entry.score,
          profileHref: userId ? `/accounts/profile/${userId}/` : null,
          isAggregate: !entry.user?.username,
        };
      });

    return entries;
  }, [details.entries, t]);

  return (
    <table className="mx-auto w-full max-w-[854px] table-fixed border-collapse border-spacing-0 border-[1px] border-gray-300 dark:border-gray-300-dark">
      <colgroup>
        <col className="w-8 sm:w-16" />
        <col />
        <col className="hidden w-[100px] sm:table-cell" />
        <col className="w-[100px]" />
      </colgroup>

      <thead>
        <tr className="items-center border-b-[1px] border-blue-400 bg-blue-100 text-gray-500 dark:border-blue-400-dark dark:bg-blue-100-dark dark:text-gray-500-dark">
          <Th />
          <Th>{t("aibLbThModel")}</Th>
          <Th className="hidden text-center sm:table-cell">
            {t("aibLbThForecasts")}
          </Th>
          <Th className="w-[100px] text-center">{t("aibLbThAvgScore")}</Th>
        </tr>
      </thead>

      <tbody className="bg-gray-0 dark:bg-gray-0-dark">
        {rows.map((r, i) => (
          <tr
            key={`${r.username}-${r.rank}`}
            className="h-[61px] border-b border-gray-300 last:border-0 dark:border-gray-300-dark"
          >
            <Td className="text-center">{i + 1}</Td>

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
                    {r.isAggregate || !r.profileHref ? (
                      r.label
                    ) : (
                      <Link className="no-underline" href={r.profileHref}>
                        {r.label}
                      </Link>
                    )}
                  </div>
                  <div className="truncate text-[10px] text-gray-500 dark:text-gray-500-dark sm:text-xs">
                    {r.username}
                  </div>
                </div>
              </div>
            </Td>

            <Td className="hidden text-center sm:table-cell">{r.forecasts}</Td>
            <Td className="w-[100px] text-center">{fmt(r.score, 2)}</Td>
          </tr>
        ))}
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

export default AIBLeaderboardTable;
