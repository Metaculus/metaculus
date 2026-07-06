import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { Href } from "@/types/navigation";
import {
  CategoryKey,
  ExclusionStatuses,
  LeaderboardEntry,
  LeaderboardType,
} from "@/types/scoring";
import cn from "@/utils/core/cn";
import { formatNumberBipm } from "@/utils/formatters/number";
import { formatUsername } from "@/utils/formatters/users";

import MedalIcon from "../../../components/medal_icon";
import {
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "../../../search_params";
import AggregationRankTooltip from "../aggregation_rank_tooltip";
import ExcludedEntryTooltip from "../excluded_entry_tooltop";

type Props = {
  rowEntry: LeaderboardEntry;
  scoreType: LeaderboardType;
  href: Href;
  isUserRow?: boolean;
};

const DEFAULT_SCORE_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};
const SCORE_FORMAT_OPTIONS: Partial<
  Record<LeaderboardType, Intl.NumberFormatOptions>
> = {
  baseline_global: { minimumFractionDigits: 0, maximumFractionDigits: 0 },
  peer_global: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
};

const LeaderboardRow: FC<Props> = ({
  rowEntry,
  scoreType,
  href,
  isUserRow = false,
}) => {
  const {
    user,
    aggregation_method,
    rank,
    coverage,
    contribution_count,
    score,
    medal,
    exclusion_status,
  } = rowEntry;

  const t = useTranslations();

  const profileUrl = user ? `/accounts/profile/${user.id}/` : null;
  const medalsUrl = user ? `/accounts/profile/${user.id}/medals/` : null;
  const username = user ? formatUsername(user) : "";

  return (
    <tr
      className={cn(
        "border-b border-gray-300 hover:bg-blue-200 dark:border-gray-300-dark dark:hover:bg-blue-200-dark",
        {
          "bg-blue-300 last-of-type:border-t hover:bg-blue-400 dark:bg-blue-300-dark hover:dark:bg-blue-400-dark":
            isUserRow,
        },
        {
          "bg-purple-200 hover:bg-purple-300 dark:bg-purple-200-dark hover:dark:bg-purple-300-dark":
            !isUserRow &&
            exclusion_status > ExclusionStatuses.EXCLUDE_PRIZE_ONLY,
        }
      )}
    >
      <td className="w-16 p-0 text-sm font-normal">
        {!user &&
        (aggregation_method === "recency_weighted" ||
          aggregation_method === "unweighted") ? (
          <Link
            href={href}
            className="flex items-center justify-between gap-1.5 py-2.5 pl-2.5 text-gray-500 no-underline"
            prefetch={false}
          >
            <AggregationRankTooltip aggregationMethod={aggregation_method} />
          </Link>
        ) : (
          <div className="flex items-center justify-between gap-1.5 pl-2.5 text-gray-500">
            {!!medal &&
              (medalsUrl ? (
                <Link
                  href={medalsUrl}
                  aria-label={t("userMedals", { username })}
                  className="flex items-center self-stretch no-underline"
                  prefetch={false}
                >
                  <MedalIcon type={medal} className="size-5" />
                </Link>
              ) : (
                <MedalIcon type={medal} className="size-5" />
              ))}
            <Link
              href={href}
              className="flex-1 py-2.5 text-center text-gray-500 no-underline"
              prefetch={false}
            >
              {exclusion_status > ExclusionStatuses.EXCLUDE_PRIZE_ONLY ? (
                <ExcludedEntryTooltip />
              ) : (
                rank
              )}
            </Link>
          </div>
        )}
      </td>
      <td
        className={cn(
          "max-w-full p-0 text-base",
          isUserRow ? "font-bold" : "font-medium"
        )}
      >
        {user && profileUrl ? (
          <div className="flex items-center">
            <Link
              href={profileUrl}
              className="block min-w-0 truncate py-2.5 pl-4 no-underline hover:underline"
              prefetch={false}
            >
              {username}
            </Link>
            <Link
              href={href}
              aria-label={t("userContributions", { username })}
              className="min-w-4 flex-1 self-stretch"
              prefetch={false}
            />
          </div>
        ) : (
          <Link
            href={href}
            className="flex items-center px-4 py-2.5 no-underline"
            prefetch={false}
          >
            <span className="truncate">
              {aggregation_method == "recency_weighted"
                ? t("communityPrediction")
                : aggregation_method == "unweighted"
                  ? t("unweightedAggregate")
                  : aggregation_method}
            </span>
          </Link>
        )}
      </td>
      <td className="hidden w-24 p-0 text-base font-[425] tabular-nums leading-4 @md:!table-cell">
        <Link
          href={href}
          className="flex items-center justify-end px-4 py-2.5 text-sm no-underline"
          prefetch={false}
        >
          {formatNumberBipm(contribution_count, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </Link>
      </td>
      {scoreType == "peer_global" && (
        <td className="hidden w-24 p-0 text-base font-[425] tabular-nums leading-4 @md:!table-cell">
          <Link
            href={href}
            className="flex items-center justify-end px-4 py-2.5 text-sm no-underline"
            prefetch={false}
          >
            {formatNumberBipm(coverage, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </Link>
        </td>
      )}
      <td
        className={cn(
          "w-20 p-0 text-base font-[425] tabular-nums leading-4",
          !isUserRow && "text-gray-600 dark:text-gray-600-dark"
        )}
      >
        <Link
          href={href}
          className="flex items-center justify-end px-4 py-2.5 text-sm no-underline"
          prefetch={false}
        >
          {formatNumberBipm(
            score,
            SCORE_FORMAT_OPTIONS[scoreType] ?? DEFAULT_SCORE_FORMAT_OPTIONS
          )}
        </Link>
      </td>
    </tr>
  );
};

type UserLeaderboardRowProps = {
  userEntry: LeaderboardEntry | null;
  category: CategoryKey;
  year: string;
  duration: string;
  scoreType: LeaderboardType;
};
export const UserLeaderboardRow: FC<UserLeaderboardRowProps> = ({
  userEntry,
  year,
  duration,
  category,
  scoreType,
}) => {
  // only show this row for users who are logged in and have any ranking data
  // in this category
  if (!userEntry?.user) return null;

  const userHref = `/contributions/${category}/${userEntry.user.id}/?${SCORING_YEAR_FILTER}=${year}&${SCORING_DURATION_FILTER}=${duration}`;

  return (
    <LeaderboardRow
      rowEntry={userEntry}
      scoreType={scoreType}
      href={userHref}
      isUserRow
    />
  );
};

export default LeaderboardRow;
