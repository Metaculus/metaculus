import classNames from "classnames";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import AwaitedGlobalLeaderboard from "@/app/(main)/leaderboard/components/global_leaderboard";
import { SearchParams } from "@/types/navigation";

import LeaderboardHeader from "./components/leaderboard_header";
import { CategoryKey } from "./constants/filters";
import {
  extractLeaderboardFiltersFromParams,
  getLeaderboardTimeInterval,
  LeaderboardFilters,
  mapCategoryKeyToLeaderboardType,
} from "./helpers/filter";

//  @TODO: How to not hardcode the ids here -- or maybe we just should (?)
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

  if (categoryKeys.length === 1) {
    const leaderboardType = mapCategoryKeyToLeaderboardType(
      categoryKeys[0],
      timeInterval.startTime,
      timeInterval.endTime
    );
    if (!leaderboardType) return null;

    return (
      <main className="mb-12 flex w-full flex-col items-center gap-3 p-2 sm:mb-24">
        <LeaderboardHeader filters={filters} />

        <Suspense
          key={JSON.stringify(searchParams)}
          fallback={<div>loading...</div>}
        >
          <AwaitedGlobalLeaderboard
            leaderboardType={leaderboardType}
            startTime={timeInterval.startTime}
            endTime={timeInterval.endTime}
          />
        </Suspense>
      </main>
    );
  }

  return (
    <main className="m-auto mb-12 flex w-full max-w-[81.5rem] flex-col items-center gap-3 p-3 sm:mb-24">
      <LeaderboardHeader filters={filters} />

      <section
        className={classNames(
          "gap-3 self-stretch overflow-hidden max-sm:hidden",
          duration === "1"
            ? "grid-cols-[repeat(auto-fill,minmax(280px,1fr))] sm:grid"
            : "sm:flex"
        )}
      >
        {categoryKeys.map((categoryKey) => {
          const leaderboardType = mapCategoryKeyToLeaderboardType(
            categoryKey,
            timeInterval.startTime,
            timeInterval.endTime
          );
          if (!leaderboardType) return null;

          return (
            <div key={categoryKey}>
              <Suspense
                key={JSON.stringify(searchParams)}
                fallback={<div>loading...</div>}
              >
                <AwaitedGlobalLeaderboard
                  leaderboardType={leaderboardType}
                  startTime={timeInterval.startTime}
                  endTime={timeInterval.endTime}
                />
              </Suspense>
            </div>
          );
        })}
      </section>
    </main>
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
