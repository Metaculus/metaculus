import { Suspense } from "react";
import invariant from "ts-invariant";

import LoadingIndicator from "@/components/ui/loading_indicator";
import { SearchParams } from "@/types/navigation";

import ContributionsHero from "./components/contributions_hero";
import GlobalContributions from "./components/global_contributions";
import { getContributionParams } from "../contributions/helpers/filters";
import {
  getLeaderboardTimeInterval,
  mapCategoryKeyToLeaderboardType,
} from "../helpers/filters";

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

  return (
    <main className="mx-auto mb-auto w-full max-w-7xl p-3 text-blue-700 dark:text-blue-700-dark">
      <ContributionsHero
        year={params.year}
        category={params.category}
        duration={params.duration}
        userId={params.userId}
      />

      <Suspense fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}>
        <GlobalContributions
          userId={params.userId}
          startTime={timeInterval.startTime}
          endTime={timeInterval.endTime}
          leaderboardType={leaderboardType}
          category={params.category}
        />
      </Suspense>
    </main>
  );
}
