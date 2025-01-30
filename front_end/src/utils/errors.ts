import * as Sentry from "@sentry/nextjs";

import { ErrorResponse } from "@/types/fetch";

export function extractError(
  field_error: any,
  config?: { parentKey?: string; detached?: boolean }
): string | undefined {
  const { detached, parentKey } = config ?? {};

  if (typeof field_error === "string") {
    if (detached && parentKey) {
      return `[${parentKey}] ${field_error}`;
    }

    return field_error;
  }

  let detachedResult: string = "";
  if (typeof field_error === "object" && field_error !== null) {
    for (const key in field_error) {
      if (field_error.hasOwnProperty(key)) {
        const value = field_error[key];
        const result = extractError(field_error[key], {
          parentKey: Array.isArray(value) ? key : parentKey,
          detached,
        });
        if (result !== undefined) {
          if (!detached) {
            return result;
          }

          detachedResult += detachedResult ? `\n${result}` : result;
        }
      }
    }

    if (detached && detachedResult) {
      return detachedResult;
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
  payload: unknown,
  message?: string
) {
  Sentry.withScope(function (scope) {
    scope.setContext("payload", { payload: JSON.stringify(payload) });
    Sentry.captureException(error);
  });
  console.error(message ?? error);
}
