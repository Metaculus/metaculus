import classNames from "classnames";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import { LeaderboardEntry } from "@/types/scoring";

import MedalIcon from "../../../components/medal_icon";

type Props = {
  rowEntry: LeaderboardEntry;
  userId?: number;
};

const TableRow: FC<Props> = ({ rowEntry, userId }) => {
  const { user_id, medal, rank, username, score, contribution_count } =
    rowEntry;
  const highlight = user_id === userId;

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
        <Link href={`/accounts/profile/${user_id}/`}>{username}</Link>
      </Td>
      <Td className="text-right" highlight={highlight}>
        {score.toFixed(2)}
      </Td>
      <Td className="text-right" highlight={highlight}>
        {contribution_count}
      </Td>
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

export default TableRow;
