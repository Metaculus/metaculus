import "server-only";

import { getLocale } from "next-intl/server";

import { getAuthCookieManager } from "@/services/auth_tokens";
import { getAlphaTokenSession } from "@/services/session";
import { FetchConfig, FetchOptions } from "@/types/fetch";

import { createFetcher, defaultOptions, handleResponse } from "./fetch.shared";
import { getPublicSettings } from "../../public_settings.server";

/**
 * Server-side fetch for API calls.
 *
 * Token refresh is handled by middleware BEFORE this runs.
 * If we get a 401 here, it means the token is invalid (not just expired)
 * and we should not attempt refresh during SSR (would invalidate tokens
 * without being able to persist new ones).
 */
async function serverFetch<T>(
  url: string,
  options: FetchOptions,
  config: { withNextJsNotFoundRedirect: boolean; passAuthHeader: boolean }
): Promise<T> {
  const { PUBLIC_API_BASE_URL, PUBLIC_AUTHENTICATION_REQUIRED } =
    getPublicSettings();
  const shouldPassAuth =
    config.passAuthHeader ?? PUBLIC_AUTHENTICATION_REQUIRED;

  const authManager = await getAuthCookieManager();
  const token = shouldPassAuth ? authManager.getAccessToken() : null;
  const alphaToken = await getAlphaTokenSession();

  const requestOptions: FetchOptions = {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(alphaToken ? { "x-alpha-auth-token": alphaToken } : {}),
    },
  };

  const finalUrl = `${PUBLIC_API_BASE_URL}/api${url}`;
  const response = await fetch(finalUrl, requestOptions);

  return handleResponse<T>(response, {
    withNextJsNotFoundRedirect: config.withNextJsNotFoundRedirect,
  });
}

const serverAppFetch = async <T>(
  url: string,
  options: FetchOptions = {},
  config?: FetchConfig
): Promise<T> => {
  let {
    emptyContentType = false,
    passAuthHeader = true,
    includeLocale = true,
    forceLocale,
  } = config ?? {};

  const { PUBLIC_AUTHENTICATION_REQUIRED } = getPublicSettings();

  // Prevent token leaks when using cache (unless auth is required for all users)
  if (
    options.next?.revalidate !== undefined &&
    !PUBLIC_AUTHENTICATION_REQUIRED
  ) {
    passAuthHeader = false;
  }

  const locale = forceLocale ?? (includeLocale ? await getLocale() : "en");

  const finalOptions: FetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
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

  return serverFetch<T>(url, finalOptions, {
    withNextJsNotFoundRedirect: true,
    passAuthHeader,
  });
};

/**
 * Server-side fetcher
 *
 * Use this to create BE service instance that can be used in server-side components
 */
export const serverFetcher = createFetcher(serverAppFetch);
