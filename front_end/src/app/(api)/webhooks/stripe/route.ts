import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || "");
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !endpointSecret) {
    console.error("Missing Stripe signature or webhook secret");
    return NextResponse.json(
      { error: "Missing signature or secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripeClient.webhooks.constructEvent(
      body,
      signature,
      endpointSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "identity.verification_session.verified":
      case "identity.verification_session.requires_input":
      case "identity.verification_session.processing":
      case "identity.verification_session.canceled":
        await handleVerificationSessionEvent(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleVerificationSessionEvent(event: Stripe.Event) {
  const verificationSession = event.data
    .object as Stripe.Identity.VerificationSession;
  try {
    await updateGoogleSheetWithStatus(verificationSession);
  } catch (error) {
    console.error("Error updating Google Sheet:", error);
    throw error;
  }
}

function getColumnIndices(
  rows: string[][],
  columnNames: string[]
): Record<string, number> {
  if (rows.length < 2) {
    throw new Error("Spreadsheet must have at least 2 rows (header rows)");
  }

  const headerRow = rows[1];

  if (!headerRow) {
    throw new Error("Header row is missing");
  }

  const columnIndices: Record<string, number> = {};

  for (const columnName of columnNames) {
    const colIndex = headerRow.findIndex((col: string) => col === columnName);
    if (colIndex === -1) {
      throw new Error(`Could not find "${columnName}" column in header row`);
    }
    columnIndices[columnName] = colIndex;
  }

  return columnIndices;
}

async function updateGoogleSheetWithStatus(
  verificationSession: Stripe.Identity.VerificationSession
) {
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
  const spreadsheetId = process.env.USER_VERIFICATIONS_GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error("USER_VERIFICATIONS_GOOGLE_SHEET_ID not configured");
  }

  // Get all rows from the spreadsheet to find the existing user row
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "main!A:G", // Get all columns including the status column
  });

  const rows = response.data.values || [];

  // Get column indices from header row
  const columnIndices = getColumnIndices(rows, [
    "stripe_verification_id",
    "status",
  ]);

  const stripeVerificationIdColIndex = columnIndices["stripe_verification_id"];
  const statusColIndex = columnIndices["status"];

  if (stripeVerificationIdColIndex === undefined) {
    throw new Error("stripe_verification_id column index not found");
  }

  if (statusColIndex === undefined) {
    throw new Error("status column index not found");
  }

  // Find the row for this verification session (skip header rows, first 2 rows)
  const userRowIndex = rows.findIndex((row, index) => {
    // Skip header rows (first 2 rows)
    if (index < 2) return false;
    // Check if this row belongs to the current verification session
    return row && row[stripeVerificationIdColIndex] === verificationSession.id;
  });

  if (userRowIndex === -1) {
    console.error(
      `No existing row found for verification session ${verificationSession.id}`
    );
    return;
  }

  // Update only the status column
  const rowNumber = userRowIndex + 1; // Google Sheets is 1-indexed
  const statusColumnLetter = String.fromCharCode(65 + statusColIndex);
  const statusRange = `main!${statusColumnLetter}${rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: statusRange,
    valueInputOption: "RAW",
    requestBody: {
      values: [[verificationSession.status]],
    },
  });

  console.log(
    `Updated row ${rowNumber} with verification status: ${verificationSession.status} for session ${verificationSession.id}`
  );
}
