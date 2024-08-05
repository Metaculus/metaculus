import { notFound } from "next/navigation";

import { getAlphaTokenSession, getServerSession } from "@/services/session";
import {
  ApiErrorResponse,
  ErrorResponse,
  FetchError,
  FetchOptions,
} from "@/types/fetch";

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

    const error: FetchError = new ApiError(data.message ?? "An error occurred");
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
};
const appFetch = async <T>(
  url: string,
  options: FetchOptions = {},
  config?: FetchConfig
): Promise<T> => {
  const { emptyContentType = false } = config ?? {};

  const authToken = getServerSession();
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
    return await handleResponse<T>(response);
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

const get = async <T>(url: string, options: FetchOptions = {}): Promise<T> => {
  return appFetch<T>(url, { ...options, method: "GET" });
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
