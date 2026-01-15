import { Suspense } from "react";

import ServerLeaderboardApi from "@/services/api/leaderboard/leaderboard.server";

import FutureEvalContainer from "../components/futureeval-container";
import FutureEvalLeaderboardHero from "../components/futureeval-leaderboard-hero";
import FutureEvalLeaderboardTable from "../components/futureeval-leaderboard-table";
import FutureEvalNavbar from "../components/futureeval-navbar";

export const metadata = {
  title: "Top Model Leaderboards | Metaculus",
  description: "Full AI model leaderboard for Metaculus FutureEval",
};

export default async function FutureEvalLeaderboardsPage() {
  let data = null;

  try {
    data = await ServerLeaderboardApi.getGlobalLeaderboard(
      null,
      null,
      "manual",
      "Global Bot Leaderboard"
    );
  } catch (error) {
    console.error("Failed to fetch leaderboard data:", error);
  }

  return (
    <div className="font-sans">
      <FutureEvalNavbar />
      <FutureEvalContainer className="pb-[148px] min-[376px]:pb-[58px]">
        <FutureEvalLeaderboardHero />

        {data?.entries?.length ? (
          <Suspense fallback={<div className="h-96" />}>
            <FutureEvalLeaderboardTable details={data} />
          </Suspense>
        ) : (
          <div className="mx-auto mt-10 w-full max-w-[570px] rounded-[2px] border border-futureeval-primary-light/30 bg-futureeval-bg-light p-8 text-base font-normal text-futureeval-bg-dark/80 dark:border-futureeval-primary-dark/30 dark:bg-futureeval-bg-dark dark:text-futureeval-bg-light/80">
            Leaderboard data not currently available, please check back soon!
          </div>
        )}
      </FutureEvalContainer>
    </div>
  );
}
