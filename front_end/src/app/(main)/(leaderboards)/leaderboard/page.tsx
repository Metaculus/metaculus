import classNames from "classnames";
import { useTranslations } from "next-intl";
import { Fragment, Suspense } from "react";

import LoadingIndicator from "@/components/ui/loading_indicator";
import { SearchParams } from "@/types/navigation";
import { CategoryKey, LeaderboardFilters } from "@/types/scoring";

import LeaderboardCategoriesTabBar from "./components/categories_tab_bar";
import GlobalLeaderboard from "./components/global_leaderboard";
import LeaderboardHeader from "./components/leaderboard_header";
import { extractLeaderboardFiltersFromParams } from "./helpers/filter";
import { LeaderboardMobileTabBarProvider } from "./mobile_tab_bar_context";
import {
  getLeaderboardTimeInterval,
  mapCategoryKeyToLeaderboardType,
} from "../helpers/filters";

export default function GlobalLeaderboards({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = useTranslations();
  const filters = extractLeaderboardFiltersFromParams(searchParams, t);
  const { year, duration } = filters;

  const categoryKeys = getPageCategoryKeys(filters);
  const timeInterval = getLeaderboardTimeInterval(year, duration);

  // single category view
  if (categoryKeys.length === 1) {
    const categoryKey = categoryKeys[0];
    const leaderboardType = mapCategoryKeyToLeaderboardType(
      categoryKey,
      Number(year) + Number(duration)
    );
    if (!leaderboardType) return null;

    return (
      <main className="mb-12 flex w-full flex-col items-center gap-3 p-2 sm:mb-24">
        <LeaderboardHeader filters={filters} />

        <Suspense
          key={JSON.stringify(filters)}
          fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}
        >
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
          className={classNames(
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
                  fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}
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

function getPageCategoryKeys(filters: LeaderboardFilters): CategoryKey[] {
  if (filters.category === "all") {
    return filters.duration === "1"
      ? ["baseline", "peer", "comments", "questionWriting"]
      : ["baseline", "peer"];
  }

  return [filters.category];
}
