import "server-only";

import {
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
  AuthTokens,
} from "@/services/auth_tokens";
import { getPublicSettings } from "@/utils/public_settings.server";

export type RefreshTokenResponse = {
  access_token: string;
  refresh_token: string;
};

/**
 * Single-flight refresh manager.
 * Concurrent requests share ONE refresh call. Cleanup after 100ms.
 */
const inFlightRefreshes = new Map<string, Promise<AuthTokens | null>>();

/**
 * Refresh tokens with single-flight pattern.
 * Can be used by both server fetcher and api-proxy.
 */
export function refreshWithSingleFlight(
  refreshToken: string
): Promise<AuthTokens | null> {
  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) return existing;

  const { PUBLIC_API_BASE_URL } = getPublicSettings();

  const promise = fetch(`${PUBLIC_API_BASE_URL}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const data: RefreshTokenResponse = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
    })
    .catch((error) => {
      console.error("Token refresh failed:", error);
      return null;
    });

  inFlightRefreshes.set(refreshToken, promise);

  promise.finally(() => {
    setTimeout(() => {
      if (inFlightRefreshes.get(refreshToken) === promise) {
        inFlightRefreshes.delete(refreshToken);
      }
    }, 100);
  });

  return promise;
}

/**
 * Refresh and persist tokens. Used by server-side fetcher.
 */
export async function refreshAccessToken(): Promise<AuthTokens | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const tokens = await refreshWithSingleFlight(refreshToken);
  if (tokens) {
    await setAuthTokens(tokens);
  } else {
    await clearAuthTokens();
  }
  return tokens;
}
