import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import RichText from "@/components/rich_text";
import Tooltip from "@/components/ui/tooltip";
import { Href } from "@/types/navigation";
import {
  CategoryKey,
  LeaderboardEntry,
  LeaderboardType,
} from "@/types/scoring";
import cn from "@/utils/cn";
import { abbreviatedNumber } from "@/utils/number_formatters";
import { formatUsername } from "@/utils/users";

import MedalIcon from "../../../components/medal_icon";
import {
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "../../../search_params";

type Props = {
  rowEntry: LeaderboardEntry;
  scoreType: LeaderboardType;
  href: Href;
  isUserRow?: boolean;
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
          {!user && aggregation_method === "recency_weighted" ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="relative text-blue-700 dark:text-blue-700-dark">
                <span className="font-league-gothic text-xl">M</span>
                <Tooltip
                  showDelayMs={200}
                  placement={"right"}
                  tooltipContent={
                    <RichText>
                      {(tags) =>
                        t.rich("leaderboardCpInfo", {
                          ...tags,
                          link: (chunks) => (
                            <Link href={"/faq/#community-prediction"}>
                              {chunks}
                            </Link>
                          ),
                        })
                      }
                    </RichText>
                  }
                  className="absolute right-[-18px] top-[0.5px] inline-flex h-full items-center justify-center font-sans"
                  tooltipClassName="font-sans text-center text-gray-800 dark:text-gray-800-dark border-blue-400 dark:border-blue-400-dark bg-gray-0 dark:bg-gray-0-dark"
                >
                  <span className="leading-none">ⓘ</span>
                </Tooltip>
              </div>
            </div>
          ) : (
            <>
              {!!medal && <MedalIcon type={medal} className="size-5" />}
              <span className="flex-1 text-center">{rank}</span>
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
                : aggregation_method}
          </span>
        </Link>
      </td>
      <td className="hidden w-24 p-0 font-mono text-base leading-4 @md:!table-cell">
        <Link
          href={href}
          className="flex items-center justify-end px-4 py-2.5 text-sm no-underline"
          prefetch={false}
        >
          {abbreviatedNumber(contribution_count, 3, false)}
        </Link>
      </td>
      {scoreType == "peer_global" && (
        <td className="hidden w-24 p-0 font-mono text-base leading-4 @md:!table-cell">
          <Link
            href={href}
            className="flex items-center justify-end px-4 py-2.5 text-sm no-underline"
            prefetch={false}
          >
            {abbreviatedNumber(coverage, 3, false)}
          </Link>
        </td>
      )}
      <td
        className={cn(
          "w-20 p-0 font-mono text-base leading-4",
          !isUserRow && "text-gray-600 dark:text-gray-600-dark"
        )}
      >
        <Link
          href={href}
          className="flex items-center justify-end px-4 py-2.5 text-sm no-underline"
          prefetch={false}
        >
          {abbreviatedNumber(score, 3, false)}
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
