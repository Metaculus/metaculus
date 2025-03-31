import { google } from "googleapis";

import { CurrentUser } from "@/types/users";

import { VerificationSession } from "./actions";

export const getGoogleSheetClient = () => {
  const credentials = JSON.parse(
    Buffer.from(
      process.env.BW_LEADERBOARDS_GOOGLE_CREDENTIALS_B64 || "",
      "base64"
    ).toString()
  );

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return sheets;
};

export const saveVerificationSession = async (
  verificationSession: VerificationSession,
  user: CurrentUser
) => {
  try {
    const sheets = getGoogleSheetClient();
    const spreadsheetId = process.env.USER_VERIFICATIONS_GOOGLE_SHEET_ID;

    // Get the current UTC timestamp
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "UTC",
    });

    // Prepare the row data
    const rowData = [
      [
        timestamp,
        verificationSession.id,
        verificationSession.url,
        user.id.toString(),
        user.username,
        `https://dashboard.stripe.com/identity/verification-sessions/${verificationSession.id}`,
      ],
    ];

    // Append the row to the spreadsheet starting from row 3
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "main!A3:E3",
      valueInputOption: "RAW",
      requestBody: {
        values: rowData,
      },
    });
  } catch (err) {
    console.error(
      "Error saving the Stripe verification session to the sheet",
      err
    );
  }
};

export const getLastVerificationSession = async (user: CurrentUser) => {
  const sheets = getGoogleSheetClient();
  const spreadsheetId = process.env.USER_VERIFICATIONS_GOOGLE_SHEET_ID;
  const range = `main!A:E`;

  // Get all rows from the spreadsheet
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const rows = response.data.values || [];

  // Find the last verification session for this user
  // Skip header rows (first 2 rows)
  const userVerifications = rows
    .slice(2)
    .filter((row) => row[3] === user.id.toString());
  if (userVerifications.length === 0) {
    return null;
  }

  // Get the last verification session (most recent)
  const lastVerification = userVerifications[userVerifications.length - 1];
  if (!lastVerification || !lastVerification[1]) {
    return null;
  }

  const verificationSessionId = lastVerification[1];

  return verificationSessionId;
};
