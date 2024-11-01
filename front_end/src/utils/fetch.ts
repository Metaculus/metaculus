import { notFound } from "next/navigation";

import { getAlphaTokenSession, getServerSession } from "@/services/session";
import {
  ApiErrorResponse,
  ErrorResponse,
  FetchError,
  FetchOptions,
} from "@/types/fetch";

import { extractError, logError } from "./errors";

class ApiError extends Error {
  public digest: string;

  constructor(message: string) {
    super(message);
    // workaround Next.js removes error information on prod
    // this workaround will be used only for REST API errors, which shouldn't provide any sensitive information in the message
    // https://nextjs.org/docs/app/building-your-application/routing/error-handling#securing-sensitive-error-information
    // https://github.com/vercel/next.js/discussions/49506#discussioncomment-10120012
    this.digest = message;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
  }
}

/**
 * Util for converting Django errors to the standardized way
 */
const normalizeApiErrors = ({
  detail,
  ...props
}: ApiErrorResponse): ErrorResponse => {
  return {
    ...props,
    message: detail,
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status === 404) {
      return notFound();
    }

    let errorData: ApiErrorResponse;

    try {
      errorData = await response.json();
    } catch (err) {
      errorData = {
        detail: "Unexpected Server Error",
      } as ApiErrorResponse;
    }

    // Converting Django errors
    const data: ErrorResponse = normalizeApiErrors(errorData);

    const error: FetchError = new ApiError(
      data.message ?? `Error occurred: \n ${extractError(data)}`
    );
    error.response = response;
    error.data = data;

    throw error;
  }

  // Some endpoints might still have successful null response
  // So need to handle such cases
  const text = await response.text();
  if (!text) {
    return null as T;
  }

  return JSON.parse(text);
};

const defaultOptions: FetchOptions = {
  headers: {
    "Content-Type": "application/json",
  },
};

type FetchConfig = {
  emptyContentType?: boolean;
  passAuthHeader?: boolean;
};
const appFetch = async <T>(
  url: string,
  options: FetchOptions = {},
  config?: FetchConfig
): Promise<T> => {
  let { emptyContentType = false, passAuthHeader = true } = config ?? {};

  // Warning: caching could be only applied to anonymised requests
  // To prevent user token leaks and storage spam.
  // NextJS caches every request variant including headers (auth token) diff
  if (options.next?.revalidate !== undefined) {
    passAuthHeader = false;
  }

  const authToken = passAuthHeader ? getServerSession() : null;
  const alphaToken = getAlphaTokenSession();

  // Default values are configured in the next.config.mjs
  const finalUrl = `${process.env.API_BASE_URL}/api${url}`;
  const finalOptions: FetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
      // Propagate current auth token
      ...(authToken
        ? {
            Authorization: `Token ${authToken}`,
          }
        : {}),
      // Propagate dev auth token
      ...(alphaToken
        ? {
            "x-alpha-auth-token": alphaToken,
          }
        : {}),
    },
  };
  if (
    emptyContentType &&
    !!finalOptions.headers &&
    "Content-Type" in finalOptions.headers
  ) {
    delete finalOptions.headers["Content-Type"];
  }

  try {
    const response = await fetch(finalUrl, finalOptions);
    // consume response in order to fix SocketError: other side is closed
    // https://stackoverflow.com/questions/76931498/typeerror-terminated-cause-socketerror-other-side-closed-in-fetch-nodejs
    const clonedRes = response.clone();
    return await handleResponse<T>(clonedRes);
  } catch (error) {
    const statusCode = (error as ErrorResponse)?.response?.status;
    const digest = (error as ApiError)?.digest;

    if (digest != "NEXT_NOT_FOUND" && (!statusCode || statusCode >= 500)) {
      console.error("Fetch error:", error);
    }

    logError(error, `Fetch error: ${error}. finalUrl: ${finalUrl}`);
    throw error;
  }
};

const get = async <T>(
  url: string,
  options: FetchOptions = {},
  config?: FetchConfig
): Promise<T> => {
  return appFetch<T>(url, { ...options, method: "GET" }, config);
};

const post = async <T, B = Record<string, any>>(
  url: string,
  body: B,
  options: FetchOptions = {}
): Promise<T> => {
  const isFormData = body instanceof FormData;

  return appFetch<T>(
    url,
    {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    },
    { emptyContentType: isFormData }
  );
};

const put = async <T, B>(
  url: string,
  body: B,
  options: FetchOptions = {}
): Promise<T> => {
  return appFetch<T>(url, {
    ...options,
    method: "PUT",
    body: JSON.stringify(body),
  });
};

const patch = async <T, B>(
  url: string,
  body: B,
  options: FetchOptions = {}
): Promise<T> => {
  return appFetch<T>(url, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
};

const del = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  return appFetch<T>(url, { ...options, method: "DELETE" });
};

export { get, post, put, del, patch };

export default appFetch;
