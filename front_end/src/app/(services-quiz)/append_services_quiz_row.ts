"use server";

import {
  appendSheetRow,
  getSheetFirstRow,
  setSheetRow,
} from "@/services/google_spreadsheets";

import type { ServicesQuizSubmitPayload } from "./helpers";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function normalizeWhoForecasts(
  v: ServicesQuizSubmitPayload["whoForecasts"] | null | undefined
) {
  if (!v) return "";
  if (v.mode === "not_sure") return "not_sure";
  return v.selections.join(",");
}

const HEADER_ROW = [
  "created_at",
  "category",
  "challenges",
  "notes",
  "timing",
  "who_forecasts",
  "privacy",
  "contact_name",
  "contact_email",
  "contact_organization",
  "contact_comments",
] as const;

async function ensureHeaderRow(
  spreadsheetId: string,
  credentialsBase64: string,
  sheetName: string
) {
  const firstRow = await getSheetFirstRow(
    spreadsheetId,
    credentialsBase64,
    sheetName
  );

  const isEmpty =
    firstRow.length === 0 ||
    firstRow.every((cell) => String(cell).trim() === "");

  if (!isEmpty) return;

  await setSheetRow(spreadsheetId, credentialsBase64, {
    sheetName,
    row: [...HEADER_ROW],
    rowIndex: 1,
    valueInputOption: "RAW",
  });
}

export async function appendServicesQuizRow(
  payload: ServicesQuizSubmitPayload
) {
  const spreadsheetId = mustEnv("SERVICES_QUIZ_GOOGLE_SHEETS_SPREADSHEET_ID");
  const credentialsBase64 = mustEnv("GOOGLE_CREDEBTIALS_FAB_SHEET_B64");
  const sheetName = "Sheet1";

  await ensureHeaderRow(spreadsheetId, credentialsBase64, sheetName);

  const row = [
    new Date().toISOString(),
    payload.category ?? "",
    payload.challenges.join(" | "),
    payload.notes ?? "",
    payload.timing ?? "",
    normalizeWhoForecasts(payload.whoForecasts),
    payload.privacy ?? "",
    payload.contact.name ?? "",
    payload.contact.email ?? "",
    payload.contact.organization ?? "",
    payload.contact.comments ?? "",
  ];

  await appendSheetRow(spreadsheetId, credentialsBase64, {
    sheetName,
    row,
    valueInputOption: "USER_ENTERED",
  });

  const zapierWebhookUrl = process.env.SERVICES_QUIZ_ZAPIER_WEBHOOK_URL;
  if (zapierWebhookUrl) {
    try {
      const response = await fetch(zapierWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          created_at: row[0],
          category: payload.category,
          challenges: payload.challenges.join(" | "),
          notes: payload.notes,
          timing: payload.timing,
          who_forecasts: normalizeWhoForecasts(payload.whoForecasts),
          privacy: payload.privacy,
          contact_name: payload.contact.name,
          contact_email: payload.contact.email,
          contact_organization: payload.contact.organization,
          contact_comments: payload.contact.comments,
        }),
      });
      if (!response.ok) {
        console.error(
          `Zapier webhook failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Zapier webhook error:", error);
    }
  }
}
