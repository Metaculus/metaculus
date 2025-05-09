import "server-only";

import { getLocale } from "next-intl/server";

import { getAlphaTokenSession, getServerSession } from "@/services/session";
import { FetchOptions, FetchConfig } from "@/types/fetch";

import { createFetcher, defaultOptions, handleResponse } from "./fetch.shared";
import { getPublicSettings } from "../../public_settings.server";

const serverAppFetch = async <T>(
  url: string,
  options: FetchOptions = {},
  config?: FetchConfig
): Promise<T> => {
  let {
    emptyContentType = false,
    passAuthHeader = true,
    includeLocale = true,
  } = config ?? {};

  // Prevent token leaks when using cache
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

  const finalUrl = `${PUBLIC_API_BASE_URL}/api${url}`;
  const finalOptions: FetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
      ...(authToken ? { Authorization: `Token ${authToken}` } : {}),
      ...(alphaToken ? { "x-alpha-auth-token": alphaToken } : {}),
      "Accept-Language": locale,
    },
  };

  if (
    emptyContentType &&
    finalOptions.headers &&
    "Content-Type" in finalOptions.headers
  ) {
    delete finalOptions.headers["Content-Type"];
  }

  const response = await fetch(finalUrl, finalOptions);
  return await handleResponse<T>(response, {
    withNextJsNotFoundRedirect: true,
  });
};

/**
 * Server-side fetcher
 *
 * Use this to create BE service instance that can be used in server-side components
 */
export const serverFetcher = createFetcher(serverAppFetch);
