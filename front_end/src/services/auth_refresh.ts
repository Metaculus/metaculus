import "server-only";

import ServerAuthApi from "@/services/api/auth/auth.server";
import { type AuthTokens } from "@/services/auth_tokens";

/**
 * Perform the actual token refresh API call.
 */
async function doRefresh(refreshToken: string): Promise<AuthTokens | null> {
  try {
    return await ServerAuthApi.refreshTokens(refreshToken);
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
}

/**
 * Single-flight refresh for Route Handlers (api-proxy).
 * Uses Map-based deduplication for concurrent requests.
 *
 * Note: SSR refresh is handled by middleware, not here.
 */
const inFlightRefreshes = new Map<string, Promise<AuthTokens | null>>();

export function refreshWithSingleFlight(
  refreshToken: string
): Promise<AuthTokens | null> {
  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) return existing;

  const promise = doRefresh(refreshToken);

  inFlightRefreshes.set(refreshToken, promise);

  promise.finally(() => {
    setTimeout(() => {
      if (inFlightRefreshes.get(refreshToken) === promise) {
        inFlightRefreshes.delete(refreshToken);
      }
    }, 10_000);
  });

  return promise;
}
