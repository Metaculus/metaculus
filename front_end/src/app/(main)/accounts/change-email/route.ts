import { redirect } from "next/navigation";

import ServerProfileApi from "@/services/api/profile/profile.server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search_params = Object.fromEntries(url.searchParams.entries());

  const { token } = search_params;

  if (token) {
    await ServerProfileApi.changeEmailConfirm(token);
  }

  return redirect("/accounts/settings");
}
