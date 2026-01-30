import { redirect } from "next/navigation";
import invariant from "ts-invariant";

import ServerAuthApi from "@/services/api/auth/auth.server";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { logError } from "@/utils/core/errors";
import { ensureRelativeRedirect } from "@/utils/navigation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search_params = Object.fromEntries(url.searchParams.entries());

  const { user_id: userId, token, redirect_url } = search_params;
  invariant(userId, "User id param is missing");
  invariant(token, "Token param is missing");

  try {
    const response = await ServerAuthApi.activateAccount(userId, token);
    const authManager = await getAuthCookieManager();
    authManager.setAuthTokens(response.tokens);
  } catch (err) {
    logError(err);
  }

  let safeRedirectUrl = "/?event=emailConfirmed";
  if (redirect_url) {
    try {
      safeRedirectUrl = ensureRelativeRedirect(
        decodeURIComponent(redirect_url)
      );
    } catch {}
  }

  return redirect(safeRedirectUrl);
}
