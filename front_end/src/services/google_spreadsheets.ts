"use server";

import { google, sheets_v4 } from "googleapis";

type GoogleSheetsScopes = "readonly" | "readwrite";

function decodeCredentials(credentialsBase64: string) {
  return JSON.parse(Buffer.from(credentialsBase64, "base64").toString());
}

function getScopes(mode: GoogleSheetsScopes): string[] {
  return mode === "readonly"
    ? ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    : ["https://www.googleapis.com/auth/spreadsheets"];
}

async function getSheetsClient(
  credentialsBase64: string,
  mode: GoogleSheetsScopes
): Promise<sheets_v4.Sheets> {
  const credentials = decodeCredentials(credentialsBase64);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: getScopes(mode),
  });

  return google.sheets({ version: "v4", auth });
}

export async function getAllSheetsData(
  spreadsheetId: string,
  credentialsBase64: string
) {
  try {
    const sheets = await getSheetsClient(credentialsBase64, "readonly");

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });

    const sheetNames =
      spreadsheet.data.sheets?.map((s) => s.properties?.title || "") ?? [];

    if (sheetNames.length === 0) return [];

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

type AppendRowOptions = {
  sheetName: string;
  row: Array<string | number | boolean | null>;
  valueInputOption?: "RAW" | "USER_ENTERED";
};

export async function appendSheetRow(
  spreadsheetId: string,
  credentialsBase64: string,
  opts: AppendRowOptions
) {
  const { sheetName, row, valueInputOption = "USER_ENTERED" } = opts;

  const sheets = await getSheetsClient(credentialsBase64, "readwrite");

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption,
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [row.map((v) => (v === null ? "" : v))],
    },
  });
}

type AppendRowsOptions = {
  sheetName: string;
  rows: Array<Array<string | number | boolean | null>>;
  valueInputOption?: "RAW" | "USER_ENTERED";
};

export async function appendSheetRows(
  spreadsheetId: string,
  credentialsBase64: string,
  opts: AppendRowsOptions
) {
  const { sheetName, rows, valueInputOption = "USER_ENTERED" } = opts;

  const sheets = await getSheetsClient(credentialsBase64, "readwrite");

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption,
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: rows.map((r) => r.map((v) => (v === null ? "" : v))),
    },
  });
}

export async function getSheetFirstRow(
  spreadsheetId: string,
  credentialsBase64: string,
  sheetName: string
): Promise<string[]> {
  const sheets = await getSheetsClient(credentialsBase64, "readonly");

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!1:1`,
  });

  return (res.data.values?.[0] as string[] | undefined) ?? [];
}
