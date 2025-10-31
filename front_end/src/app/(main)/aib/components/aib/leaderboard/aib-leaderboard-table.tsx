"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";

import openAiIcon from "@/app/(main)/aib/assets/ai-models/openai.svg?url";
import openAiDarkIcon from "@/app/(main)/aib/assets/ai-models/openai_dark.svg?url";
import type { LeaderboardDetails, LeaderboardEntry } from "@/types/scoring";

import { IconDisplay } from "../aib-icon-display";
import { getBotMeta } from "./bot_meta";

type Props = { details: LeaderboardDetails };

const AIBLeaderboardTable: React.FC<Props> = ({ details }) => {
  const t = useTranslations();

  const getDisplayName = useCallback(
    (entry: LeaderboardEntry) => {
      if (entry.user) return entry.user.username;
      if (entry.aggregation_method === "recency_weighted")
        return t("communityPrediction");
      return entry.aggregation_method ?? "Aggregate";
    },
    [t]
  );

  const rows = useMemo(() => {
    return (details.entries || []).map((entry, i) => {
      const username = entry.user?.username ?? "";
      const meta = getBotMeta(username);
      const name = meta ? meta.label : getDisplayName(entry);

      const userId = entry.user?.id;
      const profileHref = userId ? `/accounts/profile/${userId}/` : null;

      return {
        rank: entry.rank ?? i + 1,
        label: name,
        username,
        iconLight: meta?.iconLight,
        iconDark: meta?.iconDark,
        forecasts: entry.coverage ?? entry.contribution_count ?? 0,
        score: entry.score,
        profileHref,
        isAggregate: !entry.user,
      };
    });
  }, [details, getDisplayName]);

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
        {rows.map((r) => (
          <tr
            key={`${r.username}-${r.rank}`}
            className="border-b border-gray-300 last:border-0 dark:border-gray-300-dark"
          >
            <Td className="text-center">{r.rank}</Td>

            <Td>
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                {(r.iconLight || r.iconDark) && (
                  <span className="relative inline-block h-4 w-4 shrink-0 sm:h-5 sm:w-5">
                    <IconDisplay
                      icon={r.iconLight ?? r.iconDark ?? openAiIcon}
                      alt={r.label}
                      className="block dark:hidden"
                      sizes="20px"
                    />
                    <IconDisplay
                      icon={r.iconDark ?? r.iconLight ?? openAiDarkIcon}
                      alt={r.label}
                      className="hidden dark:block"
                      sizes="20px"
                    />
                  </span>
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

            <Td className="hidden text-center sm:table-cell">
              {fmt(r.forecasts, 3)}
            </Td>
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
