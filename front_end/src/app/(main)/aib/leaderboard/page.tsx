import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";

import AIBContainer from "../components/aib/aib-container";
import AIBLeaderboardHero from "../components/aib/leaderboard/aib-leaderboard-hero";
import AIBLeaderboardTable from "../components/aib/leaderboard/aib-leaderboard-table";

export const metadata = {
  title: "Top Model Leaderboards | Metaculus",
  description: "Full AI model leaderboard for Metaculus FutureEval",
};

export default async function AIBLeaderboardsPage() {
  const data = await ServerLeaderboardApi.getGlobalLeaderboard(
    null,
    null,
    "manual",
    "Global Bot Leaderboard"
  );

  return (
    <AIBContainer className="pb-[148px] min-[376px]:pb-[58px]">
      <AIBLeaderboardHero />

      {data?.entries?.length ? (
        <AIBLeaderboardTable details={data} />
      ) : (
        <div className="mx-auto mt-10 w-full max-w-[570px] rounded-[2px] border-[1px] border-gray-300 bg-gray-0 p-8 text-base font-normal text-gray-700 dark:border-gray-300-dark dark:bg-gray-0-dark dark:text-gray-700-dark">
          Leaderboard data not currently available, please check back soon!
        </div>
      )}
    </AIBContainer>
  );
}
