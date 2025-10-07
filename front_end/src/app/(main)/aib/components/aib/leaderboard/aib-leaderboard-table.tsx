"use client";

import Image from "next/image";
import { useMemo } from "react";

import type { LeaderboardDetails } from "@/types/scoring";

import { getBotMeta } from "./bot_meta";

type Props = { details: LeaderboardDetails };

const AIBLeaderboardTable: React.FC<Props> = ({ details }) => {
  const rows = useMemo(() => {
    return (details.entries || []).map((entry, i) => {
      const username = entry.user?.username ?? "";
      const meta = getBotMeta(username);

      return {
        rank: entry.rank ?? i + 1,
        label: meta.label,
        username,
        icon: meta.icon,
        forecasts: entry.coverage ?? entry.contribution_count ?? 0,
        score: entry.score,
      };
    });
  }, [details]);

  return (
    <table className="mx-auto w-full max-w-[854px] table-fixed border-collapse border-spacing-0 border-[1px] border-gray-300 dark:border-gray-300-dark">
      <colgroup>
        <col className="w-16" />
        <col />
        <col className="w-[100px]" />
        <col className="w-[100px]" />
      </colgroup>

      <thead>
        <tr className="items-center border-b-[1px] border-blue-400 bg-blue-100 text-gray-500 dark:border-blue-400-dark dark:bg-blue-100-dark dark:text-gray-500-dark">
          <Th></Th>
          <Th>Model</Th>
          <Th className="text-center">Forecasts</Th>
          <Th className="text-center">Avg Score</Th>
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
              <div className="flex min-w-0 items-center gap-3">
                {r.icon && (
                  <Image
                    src={r.icon}
                    alt={r.label}
                    className="h-5 w-5 shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <div className="truncate text-base leading-[24px]">
                    {r.label}
                  </div>
                  <div className="truncate text-xs text-gray-500 dark:text-gray-500-dark">
                    {r.username}
                  </div>
                </div>
              </div>
            </Td>

            <Td className="text-center">{fmt(r.forecasts, 3)}</Td>
            <Td className="text-center">{fmt(r.score, 2)}</Td>
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
