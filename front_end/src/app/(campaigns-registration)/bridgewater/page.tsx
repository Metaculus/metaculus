import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { google } from "googleapis";
import Image from "next/image";
import Link from "next/link";

import GlobalHeader from "@/app/(main)/components/headers/global_header";

import ResultsAnnouncement from "./components/results-announcement";
import ResultsDates from "./components/results-dates";
import ResultsHero from "./components/results-hero";
import ResultsLeaderboard from "./components/results-leaderboard";
import ResultsPrize from "./components/results-prize";

export const metadata = {
  title: "Bridgewater x Metaculus",
  description:
    "Register to forecast, explore opportunities with Bridgewater Associates, and compete for $25,000 in prizes!",
};

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

  if (!allSheets || allSheets.length === 0) {
    return <div>No data found</div>;
  }

  // Filter out any sheets that aren't Open or Undergraduate
  const filteredSheets = allSheets.filter((sheet) => {
    const name = sheet.name;
    return name === "Open Leaderboard" || name === "Undergraduate Leaderboard";
  });

  return (
    <>
      <GlobalHeader />
      <main className="mt-4 p-3 pt-12 sm:p-5 sm:pt-12 md:mt-5">
        <div className="flex flex-col items-center gap-3">
          <div className="flex w-full flex-col gap-3 md:flex-row">
            <div className="flex w-full flex-col gap-3 md:w-1/2 lg:flex-row">
              <ResultsHero />
              <div className="relative flex size-full min-h-[8rem] flex-row overflow-hidden rounded lg:h-auto lg:w-1/2">
                <Image
                  src="https://metaculus-media.s3.amazonaws.com/Cover-no-logos-wide-8Ak6wNueS-transformed.webp"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority
                  unoptimized
                />
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-1/2 lg:flex-row">
              <ResultsDates />
              <ResultsPrize />
            </div>
          </div>
          <div className="flex w-full flex-col">
            <ResultsAnnouncement />
          </div>
          <div className="flex w-full flex-col-reverse gap-3 lg:flex-row-reverse">
            <div className="flex w-full gap-3 lg:w-1/4">
              <Link
                href="/tournament/bridgewater/"
                className="flex size-full h-auto flex-col items-start justify-center gap-4 rounded bg-white p-4 text-center no-underline transition-all hover:bg-blue-500/40 dark:bg-blue-100-dark dark:hover:bg-blue-600/40 md:h-full md:p-5 lg:justify-center min-[1920px]:gap-6 min-[1920px]:p-8"
              >
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className="self-center text-3xl text-blue-700 dark:text-blue-700-dark md:text-2xl lg:self-start min-[1920px]:text-5xl"
                />
                <span className="block self-center text-center text-base text-blue-700 no-underline dark:text-blue-700-dark md:text-xl lg:self-start lg:text-left min-[1920px]:text-3xl">
                  View Contest Page
                </span>
              </Link>
            </div>
            <div className="flex size-full flex-col gap-3 md:flex-row">
              {filteredSheets.map((sheet) => (
                <ResultsLeaderboard
                  key={sheet.name}
                  title={
                    sheet.name === "Open Leaderboard"
                      ? "Open Leaderboard"
                      : "Undergrad Leaderboard"
                  }
                  data={sheet.data}
                  headers={sheet.data[0] || []}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
