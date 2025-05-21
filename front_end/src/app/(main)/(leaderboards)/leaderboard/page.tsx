import { getTranslations } from "next-intl/server";
import { FC, Fragment, Suspense } from "react";

import { SearchParams } from "@/types/navigation";
import { CategoryKey, LeaderboardFilters } from "@/types/scoring";
import cn from "@/utils/core/cn";

import LeaderboardCategoriesTabBar from "./components/categories_tab_bar";
import GlobalLeaderboard from "./components/global_leaderboard";
import LeaderboardHeader from "./components/leaderboard_header";
import { extractLeaderboardFiltersFromParams } from "./helpers/filter";
import { LeaderboardMobileTabBarProvider } from "./mobile_tab_bar_context";
import {
  getLeaderboardTimeInterval,
  mapCategoryKeyToLeaderboardType,
} from "../helpers/filters";

export const metadata = {
  title: "Leaderboards | Metaculus",
  description:
    "Explore the top forecasters on Metaculus and see how users rank by prediction accuracy and community participation.",
};

export default async function GlobalLeaderboards(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;

  const t = await getTranslations();
  const filters = extractLeaderboardFiltersFromParams(searchParams, t);
  const { year, duration } = filters;

  const categoryKeys = getPageCategoryKeys(filters);
  const timeInterval = getLeaderboardTimeInterval(year, duration);

  // single category view
  if (categoryKeys.length === 1) {
    const categoryKey = categoryKeys[0];
    if (!categoryKey) return null;

    const leaderboardType = mapCategoryKeyToLeaderboardType(
      categoryKey,
      Number(year) + Number(duration)
    );
    if (!leaderboardType) return null;

    return (
      <main className="mb-12 flex w-full flex-col items-center gap-3 p-2 sm:mb-24">
        <LeaderboardHeader filters={filters} />
        <Suspense key={JSON.stringify(filters)} fallback={<Skeleton />}>
          <GlobalLeaderboard
            leaderboardType={leaderboardType}
            startTime={timeInterval.startTime}
            endTime={timeInterval.endTime}
            duration={duration}
            year={year}
            category={categoryKey}
          />
        </Suspense>
      </main>
    );
  }

  // "all" category view
  return (
    <LeaderboardMobileTabBarProvider>
      <main className="m-auto mb-12 flex w-full max-w-[81.5rem] flex-col items-center gap-3 p-3 sm:mb-24">
        <LeaderboardHeader filters={filters} />

        <section
          className={cn(
            "flex flex-col gap-3 self-stretch overflow-hidden sm:flex-row",
            duration === "1"
              ? "grid-cols-[repeat(auto-fill,minmax(280px,1fr))] sm:grid"
              : "sm:flex"
          )}
        >
          <div className="sm:hidden">
            <LeaderboardCategoriesTabBar
              categoryKeys={categoryKeys}
              startTime={timeInterval.startTime}
              endTime={timeInterval.endTime}
              duration={duration}
              year={year}
              searchParams={searchParams}
            />
          </div>

          {categoryKeys.map((categoryKey) => {
            const leaderboardType = mapCategoryKeyToLeaderboardType(
              categoryKey,
              Number(year) + Number(duration)
            );
            if (!leaderboardType) return null;

            return (
              <Fragment key={categoryKey}>
                <Suspense
                  key={JSON.stringify(searchParams)}
                  fallback={<Skeleton />}
                >
                  <GlobalLeaderboard
                    leaderboardType={leaderboardType}
                    startTime={timeInterval.startTime}
                    endTime={timeInterval.endTime}
                    duration={duration}
                    year={year}
                    category={categoryKey}
                    cardSized
                  />
                </Suspense>
              </Fragment>
            );
          })}
        </section>

        <section className="flex w-full flex-col gap-3 sm:hidden"></section>
      </main>
    </LeaderboardMobileTabBarProvider>
  );
}

const Skeleton: FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "w-full max-w-3xl animate-pulse rounded bg-gray-0 p-4 shadow-md dark:bg-gray-0-dark",
      className
    )}
  >
    <div className="mb-2 h-8 w-full rounded bg-gray-300 dark:bg-gray-300-dark"></div>
    <div className="mb-2 h-11 w-full rounded bg-gray-300 dark:bg-gray-300-dark"></div>
    <div className="mb-2 h-11 w-full rounded bg-gray-300 dark:bg-gray-300-dark"></div>
    <div className="mb-2 h-11 w-full rounded bg-gray-300 dark:bg-gray-300-dark"></div>
    <div className="mb-2 h-11 w-full rounded bg-gray-300 dark:bg-gray-300-dark"></div>
    <div className="mb-2 h-11 w-full rounded bg-gray-300 dark:bg-gray-300-dark"></div>
  </div>
);

function getPageCategoryKeys(filters: LeaderboardFilters): CategoryKey[] {
  if (filters.category === "all") {
    return filters.duration === "1"
      ? ["baseline", "peer", "comments", "questionWriting"]
      : ["baseline", "peer"];
  }

  return [filters.category];
}
