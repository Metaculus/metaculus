import { useTranslations } from "next-intl";

import LeaderboardHeader from "@/app/(main)/leaderboard/components/leaderboard_header";
import { SearchParams } from "@/types/navigation";

import { extractLeaderboardFiltersFromParams } from "./helpers/filter";

//  @TODO: How to not hardcode the ids here -- or maybe we just should (?)
export default function GlobalLeaderboards({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = useTranslations();
  const filters = extractLeaderboardFiltersFromParams(searchParams, t);

  return (
    <main className="m-auto mb-12 flex w-full max-w-[81.5rem] flex-col items-center gap-3 p-3 sm:mb-24">
      <LeaderboardHeader filters={filters} />
    </main>
  );
}
