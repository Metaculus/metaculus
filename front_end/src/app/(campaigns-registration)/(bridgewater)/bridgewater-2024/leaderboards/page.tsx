import Link from "next/link";

import GlobalHeader from "@/app/(main)/components/headers/global_header";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { getAllSheetsData } from "@/services/google_spreadsheets";

import LeaderboardTabs from "../../components/leaderboard-tabs";

export default async function Page() {
  const allSheets = await getAllSheetsData(
    process.env.BW_LEADERBOARDS_GOOGLE_SHEET_ID_2024 || "",
    process.env.BW_LEADERBOARDS_GOOGLE_CREDENTIALS_B64 || ""
  );
  const currentUser = await ServerProfileApi.getMyProfile();
  const highlightedUser = currentUser?.username;

  if (!allSheets || allSheets.length === 0) {
    return <div>No data found</div>;
  }

  return (
    <>
      <GlobalHeader />
      <main className="mt-12 flex h-fit min-h-screen flex-col items-center justify-start p-3 sm:p-5">
        <h1 className="mb-1 text-2xl font-bold">
          Bridgewater Forecasting Contest
        </h1>
        <p className="mb-5 text-sm text-gray-700 dark:text-gray-300">
          Leaderboards get updated when questions resolve.{" "}
          <Link
            className="text-blue-700 hover:text-blue-800 dark:text-blue-400 hover:dark:text-blue-300"
            href="/tournament/bridgewater/"
          >
            View Tournament Page
          </Link>
        </p>
        <div className="w-full max-w-4xl">
          <LeaderboardTabs
            sheets={allSheets}
            highlightedUser={highlightedUser}
          />
        </div>
      </main>
    </>
  );
}
