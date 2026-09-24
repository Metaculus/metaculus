import { isNil } from "lodash";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import { ExclusionStatuses, LeaderboardEntry } from "@/types/scoring";
import cn from "@/utils/core/cn";
import { formatUsername } from "@/utils/formatters/users";

import MedalIcon from "../../../components/medal_icon";
import AggregationRankTooltip from "../aggregation_rank_tooltip";
import ExcludedEntryTooltip from "../excluded_entry_tooltop";

type Props = {
  rowEntry: LeaderboardEntry;
  maxCoverage?: number;
  userId?: number;
  withPrizePool?: boolean;
  withRankCI?: boolean;
  withScoreCI?: boolean;
  isAdvanced?: boolean;
};

function formatInterval(
  lower: number | null | undefined,
  upper: number | null | undefined,
  fractionDigits: number
): string {
  if (isNil(lower) || isNil(upper)) {
    return "-";
  }
  const lowerLabel = lower.toFixed(fractionDigits);
  const upperLabel = upper.toFixed(fractionDigits);
  return lowerLabel === upperLabel
    ? lowerLabel
    : `${lowerLabel} \u2013 ${upperLabel}`;
}

const TableRow: FC<Props> = ({
  rowEntry,
  maxCoverage,
  userId,
  withPrizePool = true,
  withRankCI = false,
  withScoreCI = false,
  isAdvanced = false,
}) => {
  const {
    user,
    aggregation_method,
    medal,
    rank,
    rank_ci_lower,
    rank_ci_upper,
    score,
    ci_lower,
    ci_upper,
    exclusion_status,
    coverage,
    contribution_count,
    take,
    percent_prize,
    prize,
  } = rowEntry;
  const t = useTranslations();
  const isExcludedFromRanking =
    exclusion_status > ExclusionStatuses.EXCLUDE_PRIZE_ONLY;
  const highlight = user?.id === userId || isExcludedFromRanking;
  const coveragePercent = coverage
    ? maxCoverage
      ? ((coverage / maxCoverage) * 100).toFixed(1) + "%"
      : (coverage * 100).toFixed(1) + "%"
    : "-";
  const forecasterLabel = user
    ? formatUsername(user)
    : aggregation_method == "recency_weighted"
      ? t("communityPrediction")
      : aggregation_method == "unweighted"
        ? t("unweightedAggregate")
        : aggregation_method ?? "";
  const forecasterLink = user
    ? `/accounts/profile/${user.id}/`
    : `/faq/#community-prediction`;

  return (
    <tr>
      <Td className="sticky left-0 text-left" highlight={highlight}>
        {!user &&
        (aggregation_method === "recency_weighted" ||
          aggregation_method === "unweighted") ? (
          <AggregationRankTooltip aggregationMethod={aggregation_method} />
        ) : (
          <>
            {!!medal &&
              (user ? (
                <Link
                  href={`/accounts/profile/${user.id}/medals/`}
                  aria-label={t("userMedals", { username: forecasterLabel })}
                >
                  <MedalIcon
                    type={medal}
                    className="mr-2 inline-block size-4"
                  />
                </Link>
              ) : (
                <MedalIcon type={medal} className="mr-2 inline-block size-4" />
              ))}

            <span className="flex-1 text-center">
              {isExcludedFromRanking ? (
                <>
                  <ExcludedEntryTooltip />
                </>
              ) : (
                rank
              )}
            </span>
          </>
        )}
      </Td>
      <Td
        className="sticky left-0 w-0 max-w-[16rem] text-left"
        highlight={highlight}
      >
        <Link
          href={forecasterLink}
          title={forecasterLabel}
          className="block truncate hover:underline"
        >
          {forecasterLabel}
        </Link>
      </Td>
      {withRankCI && (
        <Td className="text-right tabular-nums" highlight={highlight}>
          {isExcludedFromRanking
            ? "-"
            : formatInterval(rank_ci_lower, rank_ci_upper, 0)}
        </Td>
      )}
      <Td className="text-right tabular-nums" highlight={highlight}>
        {score.toFixed(3)}
      </Td>
      {isAdvanced && withScoreCI && (
        <Td className="text-right tabular-nums" highlight={highlight}>
          {formatInterval(ci_lower, ci_upper, 1)}
        </Td>
      )}
      {isAdvanced && (
        <>
          <Td className="text-right tabular-nums" highlight={highlight}>
            {contribution_count ? `${contribution_count.toFixed(0)}` : "-"}
          </Td>
          <Td className="text-right tabular-nums" highlight={highlight}>
            {coveragePercent}
          </Td>
        </>
      )}
      {withPrizePool && (
        <>
          {isAdvanced && (
            <>
              <Td className="text-right tabular-nums" highlight={highlight}>
                {take?.toFixed(3)}
              </Td>
              <Td className="text-right tabular-nums" highlight={highlight}>
                {percent_prize ? `${(percent_prize * 100).toFixed(1)}%` : "-"}
              </Td>
            </>
          )}
          <Td className="text-right tabular-nums" highlight={highlight}>
            {prize && prize >= 10 ? "$" + prize.toFixed(0) : "-"}
          </Td>
        </>
      )}
    </tr>
  );
};

const Td: FC<
  PropsWithChildren<{
    highlight: boolean;
    className?: string;
  }>
> = ({ highlight, className, children }) => (
  <td
    className={cn(
      "px-4 py-2.5 text-sm leading-4",
      highlight
        ? "bg-orange-100 dark:bg-orange-100-dark"
        : "bg-gray-0 dark:bg-gray-0-dark",
      className
    )}
  >
    {children}
  </td>
);

export default TableRow;
