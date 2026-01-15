"use server";

import { google } from "googleapis";

export async function getAllSheetsData(
  spreadsheetId: string,
  credentialsBase64: string
) {
  try {
    const credentials = JSON.parse(
      Buffer.from(credentialsBase64, "base64").toString()
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

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
