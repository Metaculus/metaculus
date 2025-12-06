import { google } from "googleapis";
import Link from "next/link";

import GlobalHeader from "@/app/(main)/components/headers/global_header";
import ServerProfileApi from "@/services/api/profile/profile.server";

import LeaderboardTabs from "./leaderboard-tabs";

async function getSheetData() {
  try {
    const credentials = JSON.parse(
      Buffer.from(
        process.env.BW_LEADERBOARDS_GOOGLE_CREDENTIALS_B64 || "",
        "base64"
      ).toString()
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.BW_LEADERBOARDS_GOOGLE_SHEET_ID;

    // First, get all sheet names
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheetNames = spreadsheet.data.sheets?.map(
      (sheet) => sheet.properties?.title || ""
    );

    if (!sheetNames || sheetNames.length === 0) {
      return [];
    }

    // Then get data for all sheets
    const allSheetsData = await Promise.all(
      sheetNames.map(async (sheetName) => {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A1:Z`,
        });
        return {
          name: sheetName,
          data: response.data.values || [],
        };
      })
    );

    return allSheetsData;
  } catch (error) {
    console.error("Error fetching sheet data:", error);
    return [];
  }
}

export default async function Page() {
  const allSheets = await getSheetData();
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
