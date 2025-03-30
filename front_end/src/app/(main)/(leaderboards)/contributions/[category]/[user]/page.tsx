import { Suspense } from "react";
import invariant from "ts-invariant";

import LoadingIndicator from "@/components/ui/loading_indicator";
import { SearchParams } from "@/types/navigation";
import { CategoryKey } from "@/types/scoring";

import {
  getLeaderboardTimeInterval,
  mapCategoryKeyToLeaderboardType,
} from "../../../helpers/filters";
import { LEADERBOARD_CATEGORIES } from "../../../leaderboard/filters";
import ContributionsHero from "../../components/contributions_hero";
import GlobalContributions from "../../components/global_contributions";
import { getContributionParams } from "../../helpers/filters";

type Props = {
  params: Promise<{ user: number; category: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function Contributions(props: Props) {
  const searchParams = await props.searchParams;
  const routeParams = await props.params;
  const category = LEADERBOARD_CATEGORIES.includes(
    routeParams.category as CategoryKey
  )
    ? (routeParams.category as CategoryKey)
    : null;
  invariant(category, "Category is not valid");

  const userId = isNaN(routeParams.user) ? null : routeParams.user;
  invariant(userId, "User ID is not valid");

  const params = getContributionParams(searchParams);

  const timeInterval = getLeaderboardTimeInterval(params.year, params.duration);
  const leaderboardType =
    mapCategoryKeyToLeaderboardType(
      category,
      Number(params.year) + Number(params.duration)
    ) ?? "baseline_global";

  return (
    <main className="mx-auto mb-auto w-full max-w-7xl p-3 text-blue-700 dark:text-blue-700-dark">
      <ContributionsHero
        year={params.year}
        category={category}
        duration={params.duration}
        userId={userId}
      />

      <Suspense fallback={<LoadingIndicator className="mx-auto my-8 w-24" />}>
        <GlobalContributions
          userId={userId}
          startTime={timeInterval.startTime}
          endTime={timeInterval.endTime}
          leaderboardType={leaderboardType}
          category={category}
        />
      </Suspense>
    </main>
  );
}
