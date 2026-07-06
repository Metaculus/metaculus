import { notFound } from "next/navigation";

import {
  ApiErrorResponse,
  FetchConfig,
  Fetcher,
  FetchOptions,
} from "@/types/fetch";
import { ApiError, logError } from "@/utils/core/errors";

export const defaultOptions: FetchOptions = {
  headers: {
    "Content-Type": "application/json",
  },
};

type ResponseHandlerConfig = {
  withNextJsNotFoundRedirect?: boolean;
};

export const handleResponse = async <T>(
  response: Response,
  config?: ResponseHandlerConfig
): Promise<T> => {
  const { withNextJsNotFoundRedirect } = config ?? {};

  if (!response.ok) {
    if (withNextJsNotFoundRedirect && response.status === 404) {
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

  try {
    return JSON.parse(text);
  } catch (error) {
    logError(error, {
      payload: text,
    });
    throw error;
  }
};

type FetchInitializer = <T>(
  url: string,
  options: FetchOptions,
  config?: FetchConfig
) => Promise<T>;

export function createFetcher(fetchInitializer: FetchInitializer): Fetcher {
  const get = <T>(
    url: string,
    options: FetchOptions = {},
    config?: FetchConfig
  ): Promise<T> => {
    return fetchInitializer<T>(url, { ...options, method: "GET" }, config);
  };

  const post = <T = Response, B = Record<string, unknown>>(
    url: string,
    body: B,
    options: FetchOptions = {},
    config?: FetchConfig
  ): Promise<T> => {
    const isFormData = body instanceof FormData;

    return fetchInitializer<T>(
      url,
      {
        ...options,
        method: "POST",
        body: isFormData ? body : JSON.stringify(body),
      },
      { emptyContentType: isFormData, ...config }
    );
  };

  const put = <T, B>(
    url: string,
    body: B,
    options: FetchOptions = {}
  ): Promise<T> => {
    return fetchInitializer<T>(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  };

  const patch = <T, B>(
    url: string,
    body: B,
    options: FetchOptions = {}
  ): Promise<T> => {
    return fetchInitializer<T>(url, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  };

  const del = <T>(url: string, options: FetchOptions = {}): Promise<T> => {
    return fetchInitializer<T>(url, { ...options, method: "DELETE" });
  };

  return { get, post, put, patch, del };
}
