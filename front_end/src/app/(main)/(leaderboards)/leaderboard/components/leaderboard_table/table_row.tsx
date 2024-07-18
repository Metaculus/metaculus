import classNames from "classnames";
import Link from "next/link";
import { FC } from "react";

import { Href } from "@/types/navigation";
import { CategoryKey, LeaderboardEntry } from "@/types/scoring";
import { abbreviatedNumber } from "@/utils/number_formatters";

import MedalIcon from "../../../components/medal_icon";
import { CONTRIBUTIONS_USER_FILTER } from "../../../contributions/search_params";
import {
  SCORING_CATEGORY_FILTER,
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "../../../search_params";

type Props = {
  rowEntry: LeaderboardEntry;
  href: Href;
  isUserRow?: boolean;
};

const LeaderboardRow: FC<Props> = ({ rowEntry, href, isUserRow = false }) => {
  const { user, rank, contribution_count, score, medal } = rowEntry;

  return (
    <tr
      className={classNames(
        "border-b border-gray-300 hover:bg-blue-200 dark:border-gray-300-dark dark:hover:bg-blue-200-dark",
        {
          "bg-blue-300 last-of-type:border-t hover:bg-blue-400 dark:bg-blue-300-dark hover:dark:bg-blue-400-dark":
            isUserRow,
        },
        {
          "bg-purple-200 hover:bg-purple-300 dark:bg-purple-200-dark hover:dark:bg-purple-300-dark":
            !isUserRow && !!user.is_staff,
        }
      )}
    >
      <td className="w-16 p-0 text-sm font-normal">
        <Link
          href={href}
          className="flex items-center justify-between gap-1.5 py-2.5 pl-2.5 text-gray-500 no-underline"
        >
          {!!medal && <MedalIcon type={medal} className="size-5" />}
          <span className="flex-1 text-center">{rank}</span>
        </Link>
      </td>
      <td
        className={classNames(
          "max-w-full p-0 text-base",
          isUserRow ? "font-bold" : "font-medium"
        )}
      >
        <Link
          href={href}
          className="flex items-center truncate px-4 py-2.5 no-underline"
        >
          {user.username}
        </Link>
      </td>
      <td className="hidden w-24 p-0 font-mono text-base leading-4 @md:!table-cell">
        <Link
          href={href}
          className="flex items-center justify-end px-4 py-2.5 text-sm no-underline"
        >
          {abbreviatedNumber(contribution_count, 3, 0)}
        </Link>
      </td>
      <td
        className={classNames(
          "w-20 p-0 font-mono text-base leading-4",
          !isUserRow && "text-gray-600 dark:text-gray-600-dark"
        )}
      >
        <Link
          href={href}
          className="flex items-center justify-end px-4 py-2.5 text-sm no-underline"
        >
          {abbreviatedNumber(score, 3, 0)}
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
};
export const UserLeaderboardRow: FC<UserLeaderboardRowProps> = ({
  userEntry,
  year,
  duration,
  category,
}) => {
  // only show this row for users who are logged in and have any ranking data
  // in this category
  if (!userEntry) return null;

  const userHref = userEntry.medal
    ? "/medals"
    : `/contributions/?${SCORING_CATEGORY_FILTER}=${category}&${CONTRIBUTIONS_USER_FILTER}=${userEntry.user.id}&${SCORING_YEAR_FILTER}=${year}&${SCORING_DURATION_FILTER}=${duration}`;

  return <LeaderboardRow rowEntry={userEntry} href={userHref} isUserRow />;
};

export default LeaderboardRow;
