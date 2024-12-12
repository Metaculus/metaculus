import * as Sentry from "@sentry/nextjs";

import { ErrorResponse } from "@/types/fetch";

export function extractError(field_error: any): string | undefined {
  if (typeof field_error === "string") return field_error;

  if (typeof field_error === "object" && field_error !== null) {
    for (const key in field_error) {
      if (field_error.hasOwnProperty(key)) {
        const result = extractError(field_error[key]);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }
}

export function logError(error: Error | unknown, message?: string) {
  const errorResponse = (error as ErrorResponse) ?? {};
  const { status = "unknown", url = "unknown" } = errorResponse?.response ?? {};
  const { digest = "unknown" } = errorResponse;

  // Capture exception in Sentry for server errors or unknown status
  if (!status || status >= 500) {
    Sentry.captureException(error);
  }

  const logChunks = [
    message ?? "Error:",
    `status_code=${status}`,
    `url=${url}`,
    `digest=${JSON.stringify(digest)}`,
    `message=${JSON.stringify(message)}`,
    `error=${JSON.stringify(error)}`,
  ];

  // Log the complete message
  console.error(logChunks.join(" "), error);
}

export function logErrorWithScope(
  error: Error | unknown,
  payload: any,
  message?: string
) {
  Sentry.withScope(function (scope) {
    scope.setContext("payload", { payload: JSON.stringify(payload) });
    Sentry.captureException(error);
  });
  console.error(message ?? error);
}
