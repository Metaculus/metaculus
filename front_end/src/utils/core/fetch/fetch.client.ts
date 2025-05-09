import { FetchOptions, FetchConfig } from "@/types/fetch";

import { createFetcher, defaultOptions, handleResponse } from "./fetch.shared";

const clientAppFetch = async <T>(
  url: string,
  options: FetchOptions = {},
  config?: FetchConfig
): Promise<T> => {
  const {
    emptyContentType = false,
    passAuthHeader = true,
    includeLocale = true,
  } = config ?? {};

  // use Next.js endpoint to handle user session on server
  // this is needed to continue using httpOnly cookies which are not exposed to JS
  const finalUrl = `/api/proxy${url}`;

  const finalOptions: FetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
      "x-empty-content": emptyContentType ? "true" : "false",
      "x-pass-auth": passAuthHeader ? "true" : "false",
      "x-include-locale": includeLocale ? "true" : "false",
    },
  };

  const response = await fetch(finalUrl, finalOptions);
  return await handleResponse<T>(response);
};

/**
 * Client-side fetcher which uses proxy endpoint to populate headers based on secured cookies
 *
 * Use this to initialize BE service instance, which can be used in client components
 */
export const clientFetcher = createFetcher(clientAppFetch);
