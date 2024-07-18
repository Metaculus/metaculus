import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import invariant from "ts-invariant";

import Button from "@/components/ui/button";
import LeaderboardApi from "@/services/leaderboard";
import { SearchParams } from "@/types/navigation";

import { getContributionParams } from "../contributions/helpers/filters";
import {
  getLeaderboardTimeInterval,
  getPeriodLabel,
  mapCategoryKeyToLeaderboardType,
} from "../helpers/filters";
import { RANKING_CATEGORIES } from "../ranking_categories";
import {
  SCORING_CATEGORY_FILTER,
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "../search_params";

export default async function Contributions({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = getContributionParams(searchParams);
  invariant(params.userId, "User ID is required");

  const timeInterval = getLeaderboardTimeInterval(params.year, params.duration);
  const leaderboardType =
    mapCategoryKeyToLeaderboardType(params.category, Number(params.year)) ??
    "baseline_global";
  const contributions = await LeaderboardApi.getContributions({
    type: "global",
    leaderboardType,
    userId: params.userId,
    startTime: timeInterval.startTime,
    endTime: timeInterval.endTime,
  });

  const t = await getTranslations();

  return (
    <main className="mx-auto mb-auto w-full max-w-7xl p-3 text-blue-700 dark:text-blue-700-dark">
      <section className="flex flex-col items-center gap-3.5 self-stretch py-3 sm:gap-7 sm:p-8">
        <div className="flex flex-col gap-4">
          <nav className="flex items-center justify-center gap-2.5 text-base font-medium leading-5">
            <a href="/leaderboard/">{t("leaderboards")}</a>
            <FontAwesomeIcon
              icon={faChevronRight}
              className="h-4 w-2.5 text-gray-400 dark:text-gray-400-dark"
            />
            <Link
              href={`/leaderboard/?${SCORING_CATEGORY_FILTER}=${params.category}&${SCORING_DURATION_FILTER}=${params.duration}&${SCORING_YEAR_FILTER}=${params.year}`}
            >
              {params.category &&
                t(RANKING_CATEGORIES[params.category].translationKey)}
            </Link>
          </nav>
          <div className="flex items-center justify-center gap-3">
            <h1 className="m-0 text-2xl font-bold text-blue-900 dark:text-blue-900-dark sm:text-4xl">
              {t("user")}
            </h1>
            <Button
              variant="primary"
              href={`/accounts/profile/${params.userId}`}
            >
              {t("viewProfile")}
            </Button>
          </div>
        </div>
        <div className="flex gap-5 text-base font-medium leading-6">
          <div className="flex gap-1.5 text-gray-500 dark:text-gray-500-dark">
            <span>{t("scoringDurationLabel")}</span>
            <span className="text-gray-800 dark:text-gray-800-dark">
              {`${params.duration} ${Number(params.duration) > 1 ? t("years") : t("year")}`}
            </span>
          </div>
          <div className="flex gap-1.5 text-gray-500 dark:text-gray-500-dark">
            <span>{t("scoringTimePeriodLabel")}</span>
            <span className="text-gray-800 dark:text-gray-800-dark">
              {getPeriodLabel(params.year, params.duration)}
            </span>
          </div>
        </div>
        <div className="max-w-3xl border-t border-gray-700 pt-3 text-center text-base font-normal leading-6 text-gray-700 dark:border-gray-700-dark dark:text-gray-700-dark sm:px-5 sm:pt-6">
          {RANKING_CATEGORIES[params.category].explanation}
        </div>
      </section>
    </main>
  );
}
