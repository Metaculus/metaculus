import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { Href } from "@/types/navigation";
import {
  CategoryKey,
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

const SCORE_DECIMALS: Partial<Record<LeaderboardType, number>> = {
  baseline_global: 0,
  peer_global: 1,
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
    excluded,
  } = rowEntry;

  const t = useTranslations();

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
            !isUserRow && excluded,
        }
      )}
    >
      <td className="w-16 p-0 text-sm font-normal">
        <Link
          href={href}
          className="flex items-center justify-between gap-1.5 py-2.5 pl-2.5 text-gray-500 no-underline"
          prefetch={false}
        >
          {!user &&
          (aggregation_method === "recency_weighted" ||
            aggregation_method === "unweighted") ? (
            <AggregationRankTooltip aggregationMethod={aggregation_method} />
          ) : (
            <>
              {!!medal && <MedalIcon type={medal} className="size-5" />}
              <span className="flex-1 text-center">
                {excluded ? (
                  <>
                    <ExcludedEntryTooltip />
                  </>
                ) : (
                  rank
                )}
              </span>
            </>
          )}
        </Link>
      </td>
      <td
        className={cn(
          "max-w-full p-0 text-base",
          isUserRow ? "font-bold" : "font-medium"
        )}
      >
        <Link
          href={href}
          className="flex items-center px-4 py-2.5 no-underline"
          prefetch={false}
        >
          <span className="truncate">
            {user
              ? formatUsername(user)
              : aggregation_method == "recency_weighted"
                ? t("communityPrediction")
                : aggregation_method == "unweighted"
                  ? t("unweightedAggregate")
                  : aggregation_method}
          </span>
        </Link>
      </td>
      <td className="hidden w-24 p-0 text-base font-[425] tabular-nums leading-4 @md:!table-cell">
        <Link
          href={href}
          className="flex items-center justify-end px-4 py-2.5 text-sm no-underline"
          prefetch={false}
        >
          {formatNumberBipm(contribution_count, 0)}
        </Link>
      </td>
      {scoreType == "peer_global" && (
        <td className="hidden w-24 p-0 text-base font-[425] tabular-nums leading-4 @md:!table-cell">
          <Link
            href={href}
            className="flex items-center justify-end px-4 py-2.5 text-sm no-underline"
            prefetch={false}
          >
            {formatNumberBipm(coverage, 1)}
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
          {formatNumberBipm(score, SCORE_DECIMALS[scoreType])}
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
  if (!userEntry) return null;

  const userHref = userEntry.medal
    ? "/medals"
    : `/contributions/${category}/${userEntry.user?.id}/?${SCORING_YEAR_FILTER}=${year}&${SCORING_DURATION_FILTER}=${duration}`;

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
