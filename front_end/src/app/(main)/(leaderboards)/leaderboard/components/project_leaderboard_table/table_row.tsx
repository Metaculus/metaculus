import classNames from "classnames";
import { isNil } from "lodash";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import { LeaderboardEntry } from "@/types/scoring";

import MedalIcon from "../../../components/medal_icon";

type Props = {
  rowEntry: LeaderboardEntry;
  withCoverage: boolean;
  withTake: boolean;
  withPrize: boolean;
  prizePool: number;
  userId?: number;
};

const TableRow: FC<Props> = ({
  rowEntry,
  withCoverage,
  withTake,
  withPrize,
  userId,
  prizePool,
}) => {
  const {
    user,
    aggregation_method,
    medal,
    rank,
    score,
    coverage,
    take,
    percent_prize,
    prize,
  } = rowEntry;
  const highlight = user?.id === userId;

  return (
    <tr className="h-8">
      <Td className="sticky left-0 text-left" highlight={highlight}>
        {medal ? (
          <MedalIcon type={medal} className="mr-2 inline-block size-4" />
        ) : (
          <div className="mr-2 inline-block size-4" />
        )}
        {rank}
      </Td>
      <Td className="sticky left-0 text-left" highlight={highlight}>
        <Link
          href={
            user ? `/accounts/profile/${user.id}/` : `questions/track-record/`
          }
        >
          {user
            ? user.username
            : aggregation_method == "recency_weighted"
              ? "Recency Weighted CP"
              : aggregation_method}
        </Link>
      </Td>
      <Td className="text-right" highlight={highlight}>
        {score.toFixed(3)}
      </Td>
      {withCoverage && (
        <Td className="text-right" highlight={highlight}>
          {coverage ? `${(coverage * 100).toFixed(0)}%` : "-"}
        </Td>
      )}
      {withTake && (
        <Td className="text-right" highlight={highlight}>
          {take?.toFixed(3)}
        </Td>
      )}
      {withPrize && (
        <>
          <Td className="text-right" highlight={highlight}>
            {percent_prize ? `${(percent_prize * 100).toFixed(1)}%` : "-"}
          </Td>
          <Td className="text-right" highlight={highlight}>
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
    className={classNames(
      "px-2 text-sm leading-4",
      highlight
        ? "bg-orange-100 dark:bg-orange-100-dark"
        : "bg-gray-0 dark:bg-gray-0-dark",
      className
    )}
  >
    {children}
  </td>
);

const getUserPrize = (prizePool: number, percentPrize?: number): string => {
  if (isNil(percentPrize)) return "-";

  const prize = prizePool * percentPrize;
  return prize >= 10 ? "$" + prize.toFixed(0) : "-";
};

export default TableRow;
