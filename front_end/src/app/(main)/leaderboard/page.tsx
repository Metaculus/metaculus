import classNames from "classnames";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import AwaitedGlobalLeaderboard from "@/app/(main)/leaderboard/components/global_leaderboard";
import MobileGlobalLeaderboard from "@/app/(main)/leaderboard/components/mobile_global_leaderboard";
import ProfileApi from "@/services/profile";
import { SearchParams } from "@/types/navigation";
import { CategoryKey, LeaderboardFilters } from "@/types/scoring";

import LeaderboardHeader from "./components/leaderboard_header";
import {
  extractLeaderboardFiltersFromParams,
  getLeaderboardTimeInterval,
  mapCategoryKeyToLeaderboardType,
} from "./helpers/filter";

//  @TODO: How to not hardcode the ids here -- or maybe we just should (?)
export default async function GlobalLeaderboards({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const profile = await ProfileApi.getMyProfile();
  const userId = profile?.id;

  const t = await getTranslations();
  const filters = extractLeaderboardFiltersFromParams(searchParams, t);
  const { year, duration } = filters;

  const categoryKeys = getPageCategoryKeys(filters);
  const timeInterval = getLeaderboardTimeInterval(year, duration);

  if (categoryKeys.length === 1) {
    const categoryKey = categoryKeys[0];
    const leaderboardType = mapCategoryKeyToLeaderboardType(
      categoryKey,
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
            duration={duration}
            year={year}
            category={categoryKey}
            userId={userId}
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
                  duration={duration}
                  year={year}
                  category={categoryKey}
                  cardSized
                  userId={userId}
                />
              </Suspense>
            </div>
          );
        })}
      </section>

      <section className="flex w-full flex-col gap-3 sm:hidden">
        <MobileGlobalLeaderboard categoryKeys={categoryKeys} />
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
