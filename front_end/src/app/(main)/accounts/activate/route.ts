import { redirect } from "next/navigation";
import invariant from "ts-invariant";

import ServerAuthApi from "@/services/api/auth/auth.server";
import { setServerSession } from "@/services/session";
import { logError } from "@/utils/core/errors";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search_params = Object.fromEntries(url.searchParams.entries());

  const { user_id: userId, token, redirect_url } = search_params;
  invariant(userId, "User id param is missing");
  invariant(token, "Token param is missing");

  try {
    const response = await ServerAuthApi.activateAccount(userId, token);
    await setServerSession(response);
  } catch (err) {
    logError(err);
  }

  if (redirect_url) {
    return redirect(decodeURIComponent(redirect_url));
  }

  return redirect("/?event=emailConfirmed");
}
