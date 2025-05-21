import * as Sentry from "@sentry/nextjs";
import { EventHint, ErrorEvent } from "@sentry/nextjs";
import { isNil } from "lodash";

import { ApiErrorResponse, ErrorResponse } from "@/types/fetch";

export const API_ERROR_TAG = "[API_ERROR]";

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
 * When using with server actions `response` and `data` are only available on server-side unless manually propagated
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
    this.digest = `${API_ERROR_TAG} ${message}`;
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

export function logError(
  error: unknown,
  options?: { message?: string; payload?: unknown }
) {
  const { message, payload } = options ?? {};

  // 1. Log error to console
  if (ApiError.isApiError(error) && !isNil(error.response)) {
    const { digest } = error;
    const { status, url } = error.response;

    const logChunks = [
      message ?? "Error:",
      `status_code=${status}`,
      `url=${url}`,
      `digest=${JSON.stringify(digest)}`,
      `message=${JSON.stringify(message)}`,
      `error=${JSON.stringify(error)}`,
    ];

    console.error(logChunks.join(" "), error);
  } else {
    console.error(message ?? error);
  }

  // 2. Log error to Sentry
  if (payload) {
    Sentry.withScope(function (scope) {
      scope.setContext("payload", { payload: JSON.stringify(payload) });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

export const SENTRY_IGNORE_ERRORS: string[] = [
  /*
   * Next.js specific errors
   */
  "NEXT_REDIRECT",
  "NEXT_NOT_FOUND",
  "NEXT_HTTP_ERROR_FALLBACK;404",

  /*
   * The error is related to Edge Mobile
   * https://techcommunity.microsoft.com/discussions/edgeinsiderdiscussions/error-cant-find-variable-logmutedmessage-on-edge-mobile-/3912307
   */
  "Can't find variable: logMutedMessage",
];

export function beforeSentryAlertSend(event: ErrorEvent, hint: EventHint) {
  const error = hint.originalException;

  if (
    !ApiError.isApiError(error) &&
    error instanceof Error &&
    "digest" in error &&
    typeof error.digest === "string"
  ) {
    const { digest } = error;

    if (digest.includes(API_ERROR_TAG)) {
      // don't track unhandled API errors in Next.js error boundary
      // Next.js won't properly serialize ApiError error when passing it into error boundary
      // we ensure that all required api errors are logged inside handleResponse
      return null;
    }
  }

  if (ApiError.isApiError(error)) {
    const { response, data } = error;

    if (isNil(response) && isNil(data)) {
      // don't track ApiError on client when handling manually
      // custom fields won't be properly serialized
      // we ensure that all required api errors are logged inside handleResponse
      return null;
    }

    const { status } = response;
    if (!!status && status < 500) {
      // ensure only severe errors are logged to Sentry
      return null;
    }

    return event;
  }

  return event;
}
