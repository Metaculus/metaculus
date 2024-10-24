import * as Sentry from "@sentry/nextjs";

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
  Sentry.captureException(error);
  console.error(message ?? error);
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
