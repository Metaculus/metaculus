"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState } from "react";

import MedalIcon from "@/app/(main)/(leaderboards)/components/medal_icon";
import {
  entryIconPair,
  entryLabel,
  shouldDisplayEntry,
} from "@/app/(main)/aib/components/aib/leaderboard/utils";
import { LightDarkIcon } from "@/app/(main)/aib/components/aib/light-dark-icon";
import type { LeaderboardDetails, MedalType } from "@/types/scoring";
import cn from "@/utils/core/cn";

type Props = { details: LeaderboardDetails; className?: string };

const INITIAL_ROWS = 5;

const MEDALS: Record<number, MedalType> = {
  1: "gold",
  2: "silver",
  3: "bronze",
};

const MedalRow: FC<{ rank: number }> = ({ rank }) => {
  const medalType = MEDALS[rank];

  return medalType ? (
    <MedalIcon type={medalType} className="size-8" />
  ) : (
    <span className="text-sm font-normal text-gray-1000 dark:text-gray-1000-dark">
      {rank}
    </span>
  );
};

const FutureEvalTable: React.FC<Props> = ({ details, className }) => {
  const t = useTranslations();
  const [expanded, setExpanded] = useState(false);

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
          forecasts: entry.contribution_count,
          score: entry.score,
          profileHref: userId ? `/accounts/profile/${userId}/` : null,
          isAggregate: !entry.user?.username,
        };
      });

    return entries;
  }, [details.entries, t]);

  const visibleRows = expanded ? rows : rows.slice(0, INITIAL_ROWS);

  return (
    <div className={cn("flex max-h-full w-full flex-col gap-2", className)}>
      <div
        className={cn(
          "max-h-full w-full grow-0 overflow-y-hidden rounded-lg border border-gray-300 dark:border-gray-300-dark",
          expanded && "overflow-y-auto"
        )}
      >
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[72px]" />
            <col />
            <col className="hidden w-[100px] sm:table-cell" />
            <col className="hidden w-[100px] sm:table-cell" />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="h-12 bg-gray-200 text-gray-600 dark:bg-gray-200-dark dark:text-gray-600-dark">
              <Th className="pl-6">{t("rank")}</Th>
              <Th>{t("aibLbThModel")}</Th>
              <Th className="hidden text-right sm:table-cell">{t("score")}</Th>
              <Th className="hidden pr-6 text-right sm:table-cell">
                {t("aibLbThForecasts")}
              </Th>
            </tr>
          </thead>
          <tbody className="bg-gray-0 dark:bg-gray-0-dark">
            {visibleRows.map((r) => (
              <tr
                key={`${r.username}-${r.rank}`}
                className="h-14 border-b border-gray-300 last:border-0 dark:border-gray-300-dark"
              >
                <Td className="pl-6">
                  <div className="flex items-center justify-center">
                    <MedalRow rank={r.rank} />
                  </div>
                </Td>

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
                    <div className="min-w-0 truncate text-sm font-medium text-gray-700 dark:text-gray-700-dark">
                      {r.isAggregate || !r.profileHref ? (
                        r.label
                      ) : (
                        <Link className="no-underline" href={r.profileHref}>
                          {r.label}
                        </Link>
                      )}
                    </div>
                  </div>
                </Td>

                <Td className="hidden text-right sm:table-cell">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-700-dark">
                    {fmt(r.score, 2)}
                  </span>
                </Td>
                <Td className="hidden pr-6 text-right sm:table-cell">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-700-dark">
                    {r.forecasts}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > INITIAL_ROWS && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-auto flex h-12 w-full shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-gray-0 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-300-dark dark:bg-gray-0-dark dark:text-gray-600-dark dark:hover:bg-gray-100-dark"
        >
          {expanded ? t("viewLess") : t("viewMore")}
        </button>
      )}
    </div>
  );
};

const fmt = (n: number | null | undefined, d = 2) =>
  n == null || Number.isNaN(n) ? "—" : n.toFixed(d);

const Th: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({
  className = "",
  children,
}) => (
  <th
    className={cn(
      "text-nowrap px-4 py-4 text-left text-sm font-semibold leading-none tracking-tight",
      className
    )}
  >
    {children}
  </th>
);

const Td: React.FC<React.HTMLAttributes<HTMLTableCellElement>> = ({
  className = "",
  children,
}) => <td className={cn("px-4 py-2.5", className)}>{children}</td>;

export default FutureEvalTable;
