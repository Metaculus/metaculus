import { redirect } from "next/navigation";

import ProfileApi from "@/services/profile";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const search_params = Object.fromEntries(url.searchParams.entries());

  const { token } = search_params;

  await ProfileApi.changeEmailConfirm(token);

  return redirect("/accounts/settings");
}
