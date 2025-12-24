import "server-only";

import { getLocale } from "next-intl/server";

import { refreshAccessToken } from "@/services/auth_refresh";
import {
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
} from "@/services/auth_tokens";
import { getAlphaTokenSession } from "@/services/session";
import { FetchConfig, FetchOptions } from "@/types/fetch";

import { createFetcher, defaultOptions, handleResponse } from "./fetch.shared";
import { getPublicSettings } from "../../public_settings.server";

async function fetchWithRefresh<T>(
  url: string,
  options: FetchOptions,
  config: { withNextJsNotFoundRedirect: boolean; passAuthHeader: boolean }
): Promise<T> {
  const { PUBLIC_API_BASE_URL, PUBLIC_AUTHENTICATION_REQUIRED } =
    getPublicSettings();
  const shouldPassAuth =
    config.passAuthHeader || PUBLIC_AUTHENTICATION_REQUIRED;

  // Proactive refresh: check expiration before making request
  if (shouldPassAuth && (await isAccessTokenExpired())) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await refreshAccessToken();
    }
  }

  const buildHeaders = async (accessToken?: string): Promise<FetchOptions> => {
    const token =
      accessToken ?? (shouldPassAuth ? await getAccessToken() : null);
    const alphaToken = await getAlphaTokenSession();

    return {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(alphaToken ? { "x-alpha-auth-token": alphaToken } : {}),
      },
    };
  };

  const finalUrl = `${PUBLIC_API_BASE_URL}/api${url}`;

  let requestOptions = await buildHeaders();
  let response = await fetch(finalUrl, requestOptions);

  // Fallback: retry on 401 (in case proactive check missed edge cases)
  if (response.status === 401 && shouldPassAuth) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      const newTokens = await refreshAccessToken();
      if (newTokens) {
        requestOptions = await buildHeaders(newTokens.accessToken);
        response = await fetch(finalUrl, requestOptions);
      }
    }
  }

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

  // Prevent token leaks when using cache
  if (options.next?.revalidate !== undefined) {
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

  return fetchWithRefresh<T>(url, finalOptions, {
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
