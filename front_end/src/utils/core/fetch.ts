import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";

import { getAlphaTokenSession, getServerSession } from "@/services/session";
import { ApiErrorResponse, FetchOptions } from "@/types/fetch";

import { ApiError, logError } from "./errors";
import { getPublicSettings } from "../public_settings.server";

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    if (response.status === 404) {
      return notFound();
    }

    let errorData: ApiErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        detail: "Unexpected Api Error",
      } as ApiErrorResponse;
    }

    const apiError = new ApiError(response, errorData);
    logError(apiError);

    throw apiError;
  }

  // Check the content type to determine how to process the response
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/zip")) {
    // If the response is a ZIP, return it as a Blob
    return response.blob() as unknown as T;
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
  includeLocale?: boolean;
};
const appFetch = async <T>(
  url: string,
  options: FetchOptions = {},
  config?: FetchConfig
): Promise<T> => {
  let {
    emptyContentType = false,
    passAuthHeader = true,
    includeLocale = true,
  } = config ?? {};

  // Warning: caching could be only applied to anonymised requests
  // To prevent user token leaks and storage spam.
  // NextJS caches every request variant including headers (auth token) diff
  if (options.next?.revalidate !== undefined) {
    passAuthHeader = false;
  }

  const { PUBLIC_API_BASE_URL, PUBLIC_AUTHENTICATION_REQUIRED } =
    getPublicSettings();

  const authToken =
    passAuthHeader || PUBLIC_AUTHENTICATION_REQUIRED
      ? await getServerSession()
      : null;
  const alphaToken = await getAlphaTokenSession();
  const locale = includeLocale ? await getLocale() : "en";

  // Default values are configured in the next.config.mjs
  const finalUrl = `${PUBLIC_API_BASE_URL}/api${url}`;
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
      "Accept-Language": locale,
    },
  };
  if (
    emptyContentType &&
    !!finalOptions.headers &&
    "Content-Type" in finalOptions.headers
  ) {
    delete finalOptions.headers["Content-Type"];
  }

  const response = await fetch(finalUrl, finalOptions);
  return await handleResponse<T>(response);
};

const get = async <T>(
  url: string,
  options: FetchOptions = {},
  config?: FetchConfig
): Promise<T> => {
  return appFetch<T>(url, { ...options, method: "GET" }, config);
};

const post = async <T = Response, B = Record<string, unknown>>(
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
