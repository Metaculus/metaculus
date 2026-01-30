import { redirect } from "next/navigation";

import ServerProfileApi from "@/services/api/profile/profile.server";
import { getAuthCookieManager } from "@/services/auth_tokens";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search_params = Object.fromEntries(url.searchParams.entries());

  const { token } = search_params;

  if (token) {
    const tokens = await ServerProfileApi.changeEmailConfirm(token);
    const authManager = await getAuthCookieManager();
    authManager.setAuthTokens(tokens);
  }

  return redirect("/accounts/settings");
}
