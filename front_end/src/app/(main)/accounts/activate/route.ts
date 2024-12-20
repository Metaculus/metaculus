import { redirect } from "next/navigation";

import AuthApi from "@/services/auth";
import { setServerSession } from "@/services/session";
import { SocialProviderType } from "@/types/auth";
import { logError } from "@/utils/errors";
import invariant from "ts-invariant";

export async function GET(
  request: Request,
  { params }: { params: { provider: SocialProviderType } }
) {
  const url = new URL(request.url);
  const search_params = Object.fromEntries(url.searchParams.entries());

  const { user_id: userId, token, redirect_url } = search_params;
  invariant(userId, "User id param is missing");
  invariant(token, "Token param is missing");

  try {
    const response = await AuthApi.activateAccount(userId, token);
    setServerSession(response.token);
  } catch (err) {
    logError(err);
  }

  if (redirect_url) {
    return redirect(decodeURIComponent(redirect_url));
  }

  return redirect("/?event=emailConfirmed");
}
