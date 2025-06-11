import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import { LeaderboardEntry } from "@/types/scoring";
import cn from "@/utils/core/cn";
import { formatUsername } from "@/utils/formatters/users";

import MedalIcon from "../../../components/medal_icon";
import RecencyWeightedAggregationRow from "../recency_weighted_aggregation_row";

type Props = {
  rowEntry: LeaderboardEntry;
  withCoverage?: boolean;
  userId?: number;
  withPrizePool?: boolean;
};

const TableRow: FC<Props> = ({
  rowEntry,
  withCoverage = false,
  userId,
  withPrizePool = true,
}) => {
  const {
    user,
    aggregation_method,
    medal,
    rank,
    score,
    excluded,
    coverage,
    take,
    percent_prize,
    prize,
  } = rowEntry;
  const highlight = user?.id === userId || excluded;
  const t = useTranslations();

  if (!withPrizePool) {
    return (
      <tr>
        <Td className="sticky left-0 text-left" highlight={highlight}>
          {!user && aggregation_method === "recency_weighted" ? (
            <RecencyWeightedAggregationRow />
          ) : (
            <>
              {!!medal && (
                <MedalIcon type={medal} className="mr-2 inline-block size-4" />
              )}
              <span className="flex-1 text-center">{rank}</span>
            </>
          )}
        </Td>
        <Td className="sticky left-0 text-left" highlight={highlight}>
          <Link
            href={
              user
                ? `/accounts/profile/${user.id}/`
                : `/faq/#community-prediction`
            }
          >
            {user
              ? formatUsername(user)
              : aggregation_method == "recency_weighted"
                ? t("communityPrediction")
                : aggregation_method}
          </Link>
        </Td>
        <Td className="text-right tabular-nums" highlight={highlight}>
          {score.toFixed(3)}
        </Td>
      </tr>
    );
  }

  return (
    <tr>
      <Td className="sticky left-0 text-left" highlight={highlight}>
        {!user && aggregation_method === "recency_weighted" ? (
          <RecencyWeightedAggregationRow />
        ) : (
          <>
            {!!medal && <MedalIcon type={medal} className="size-5" />}
            <span className="flex-1 text-center">{rank}</span>
          </>
        )}
      </Td>
      <Td className="sticky left-0 text-left" highlight={highlight}>
        <Link
          href={
            user
              ? `/accounts/profile/${user.id}/`
              : `/faq/#community-prediction`
          }
        >
          {user
            ? formatUsername(user)
            : aggregation_method == "recency_weighted"
              ? t("communityPrediction")
              : aggregation_method}
        </Link>
      </Td>
      <Td className="text-right tabular-nums" highlight={highlight}>
        {score.toFixed(3)}
      </Td>
      {withCoverage && (
        <Td className="text-right tabular-nums" highlight={highlight}>
          {coverage ? `${(coverage * 100).toFixed(0)}%` : "-"}
        </Td>
      )}
      <Td className="text-right tabular-nums" highlight={highlight}>
        {take?.toFixed(3)}
      </Td>
      <>
        <Td className="text-right tabular-nums" highlight={highlight}>
          {percent_prize ? `${(percent_prize * 100).toFixed(1)}%` : "-"}
        </Td>
        <Td className="text-right tabular-nums" highlight={highlight}>
          {prize && prize >= 10 ? "$" + prize.toFixed(0) : "-"}
        </Td>
      </>
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
