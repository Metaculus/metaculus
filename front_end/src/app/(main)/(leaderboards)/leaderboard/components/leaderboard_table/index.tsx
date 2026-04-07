"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { useAuth } from "@/contexts/auth_context";
import { useBreakpoint } from "@/hooks/tailwind";
import {
  CategoryKey,
  ExclusionStatuses,
  LeaderboardDetails,
} from "@/types/scoring";

import LeaderboardRow, { UserLeaderboardRow } from "./table_row";
import { RANKING_CATEGORIES } from "../../../ranking_categories";
import {
  SCORING_CATEGORY_FILTER,
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "../../../search_params";
import useLeaderboardMobileTabBar from "../../mobile_tab_bar_context";

type Props = {
  year: string;
  duration: string;
  category: CategoryKey;
  leaderboardDetails: LeaderboardDetails;
  cardSized?: boolean;
};

const LeaderboardTable: FC<Props> = ({
  year,
  duration,
  category,
  leaderboardDetails,
  cardSized = false,
}) => {
  const t = useTranslations();
  const { activeCategoryKey } = useLeaderboardMobileTabBar();
  const isLargeScreen = useBreakpoint("sm");
  const { user: currentUser } = useAuth();

  const categoryUrl = `/leaderboard/?${SCORING_CATEGORY_FILTER}=${category}&${SCORING_YEAR_FILTER}=${year}&${SCORING_DURATION_FILTER}=${duration}`;

  const userEntry = leaderboardDetails.userEntry ?? null;
  const entriesToDisplay = cardSized
    ? leaderboardDetails.entries.slice(0, 10)
    : leaderboardDetails.entries;

  if (!isLargeScreen && !!activeCategoryKey && activeCategoryKey !== category) {
    return null;
  }

  return (
    <div className="h-min w-full min-w-[280px] max-w-3xl rounded border border-gray-300 bg-gray-0 text-gray-800 @container dark:border-gray-300-dark dark:bg-gray-0-dark dark:text-gray-800-dark">
      {cardSized && (
        <Link
          href={categoryUrl}
          className="flex cursor-pointer gap-6 border-b border-gray-300 p-5 text-xl font-medium text-blue-800 no-underline hover:bg-gray-100 dark:border-gray-300-dark dark:text-blue-800-dark hover:dark:bg-gray-100-dark"
        >
          <span>{t(RANKING_CATEGORIES[category].translationKey)}</span>
        </Link>
      )}
      <table className="table w-full table-fixed">
        <tbody>
          {/* in the single-category page, this row is on the top */}
          {!cardSized && (
            <UserLeaderboardRow
              userEntry={userEntry}
              year={year}
              duration={duration}
              category={category}
              scoreType={leaderboardDetails.score_type}
            />
          )}

          <tr className="border-b border-blue-400 bg-blue-100 text-sm font-bold text-gray-500 dark:border-blue-400-dark dark:bg-blue-100-dark dark:text-gray-500-dark">
            <th className="w-16" />
            <th className="px-4 py-2.5 text-left">{t("user")}</th>
            <th className="hidden w-24 px-4 py-2.5 text-right @md:!table-cell">
              {category === "comments" ? t("comments") : t("questions")}
            </th>
            {leaderboardDetails.score_type === "peer_global" && (
              <th className="hidden w-24 px-4 py-2.5 text-right @md:!table-cell">
                {t("totalCoverage")}
              </th>
            )}
            <th className="w-20 px-4 py-2.5 text-right">{t("score")}</th>
          </tr>
          {!!entriesToDisplay.length ? (
            entriesToDisplay.map((entry) => {
              // only show entries that are not excluded
              // or if current user is staff and exclusion status allows showing in advanced mode
              const exclusionStatus = entry.exclusion_status;
              if (
                exclusionStatus == ExclusionStatuses.EXCLUDE ||
                (exclusionStatus ==
                  ExclusionStatuses.EXCLUDE_AND_SHOW_IN_ADVANCED &&
                  !currentUser?.is_staff)
              ) {
                return null;
              }
              let navigationUrl: string;
              if (cardSized) {
                // on combined global leaderboard all table row links to the category page
                navigationUrl = categoryUrl;
              } else {
                navigationUrl = entry.user
                  ? `/contributions/${category}/${entry.user.id}/?${SCORING_YEAR_FILTER}=${year}&${SCORING_DURATION_FILTER}=${duration}`
                  : `/questions/track-record`;
              }
              if (entry.user && entry.user.id === userEntry?.user?.id) {
                return (
                  <UserLeaderboardRow
                    key={`user-leaderboard-row-${entry.user.id}`}
                    userEntry={userEntry}
                    year={year}
                    duration={duration}
                    category={category}
                    scoreType={leaderboardDetails.score_type}
                  />
                );
              } else {
                return (
                  <LeaderboardRow
                    key={`ranking-row-${category}-${entry.user ? entry.user.id : entry.aggregation_method}`}
                    rowEntry={entry}
                    scoreType={leaderboardDetails.score_type}
                    href={navigationUrl}
                  />
                );
              }
            })
          ) : (
            <tr className="border-b border-gray-300  dark:border-gray-300-dark">
              <td
                colSpan={3}
                className="max-w-full p-4 text-center text-base italic text-gray-700 dark:text-gray-700-dark"
              >
                {t("noQuestionsResolved")}
              </td>
            </tr>
          )}
          {cardSized && (
            <>
              <tr className="bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-100-dark dark:text-blue-600-dark dark:hover:bg-blue-200-dark">
                <td className="p-0">
                  <Link href={categoryUrl} className="flex px-4 py-2.5" />
                </td>
                <td className="p-0" colSpan={2}>
                  <Link
                    href={categoryUrl}
                    className="flex px-4 py-2.5 text-base font-medium no-underline"
                  >
                    {t("viewMore")}
                  </Link>
                </td>
                <td className="hidden p-0 @md:!table-cell">
                  <Link href={categoryUrl} />
                </td>
              </tr>
              {/* in the single-category page, this row is on the bottom */}
              <UserLeaderboardRow
                userEntry={userEntry}
                year={year}
                duration={duration}
                category={category}
                scoreType={leaderboardDetails.score_type}
              />
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
