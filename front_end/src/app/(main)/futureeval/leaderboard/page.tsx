import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";

import AIBLeaderboardTable from "../../aib/components/aib/leaderboard/aib-leaderboard-table";
import FutureEvalContainer from "../components/futureeval-container";
import FutureEvalLeaderboardHero from "../components/futureeval-leaderboard-hero";

export const metadata = {
  title: "Top Model Leaderboards | Metaculus",
  description: "Full AI model leaderboard for Metaculus FutureEval",
};

export default async function FutureEvalLeaderboardsPage() {
  const data = await ServerLeaderboardApi.getGlobalLeaderboard(
    null,
    null,
    "manual",
    "Global Bot Leaderboard"
  );

  return (
    <FutureEvalContainer className="pb-[148px] min-[376px]:pb-[58px]">
      <FutureEvalLeaderboardHero />

      {data?.entries?.length ? (
        <AIBLeaderboardTable details={data} />
      ) : (
        <div className="mx-auto mt-10 w-full max-w-[570px] rounded-[2px] border-[1px] border-violet-300 bg-gray-0 p-8 text-base font-normal text-gray-700 dark:border-violet-300-dark dark:bg-gray-0-dark dark:text-gray-700-dark">
          Leaderboard data not currently available, please check back soon!
        </div>
      )}
    </FutureEvalContainer>
  );
}
