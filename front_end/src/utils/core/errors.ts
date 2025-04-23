import * as Sentry from "@sentry/nextjs";
import { isNil } from "lodash";

import { ApiErrorResponse, ErrorResponse } from "@/types/fetch";

const normalizeApiErrors = ({
  detail,
  ...props
}: ApiErrorResponse): ErrorResponse => ({
  ...props,
  message: detail,
});

/**
 * Custom class for API-driven errors
 *
 * When using with server actions `response` and `data` are only available on server-side unless manually propogated
 */
export class ApiError extends Error {
  // workaround Next.js removes error information on prod by utilizing digest for error messages
  // this workaround will be used only for REST API errors, which shouldn't provide any sensitive information in the message
  // https://nextjs.org/docs/app/building-your-application/routing/error-handling#securing-sensitive-error-information
  // https://github.com/vercel/next.js/discussions/49506#discussioncomment-10120012
  public digest: string;

  public response: Response;
  public data: ErrorResponse;

  constructor(response: Response, apiError: ApiErrorResponse) {
    const message =
      extractError(apiError.detail ?? apiError.non_field_errors ?? apiError, {
        detached: true,
      }) ?? "Unexpected API Error";

    super(message);
    this.digest = message;
    this.response = response;
    this.data = normalizeApiErrors(apiError);

    this.name = "ApiError";

    Object.setPrototypeOf(this, ApiError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  static isApiError(err: unknown): err is ApiError {
    return err instanceof Error && err.name === "ApiError";
  }
}

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

export function logError(error: unknown, message?: string) {
  if (ApiError.isApiError(error)) {
    const { digest, response, data } = error;

    if (isNil(response) && isNil(data)) {
      // don't track ApiError on client
      // custom fields won't be properly serialized
      // we ensure that all required api errors are logged inside handleResponse
      console.error(message ?? error);
      return;
    }

    const { status, url } = response;

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
    return;
  }

  // Capture any non-api error to sentry
  Sentry.captureException(error);
  console.error(message ?? error);
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
