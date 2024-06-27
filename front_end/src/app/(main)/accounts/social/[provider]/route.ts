import { redirect } from "next/navigation";

import AuthApi from "@/services/auth";
import { setServerSession } from "@/services/session";
import { SocialProviderType } from "@/types/auth";

export async function GET(
  request: Request,
  { params }: { params: { provider: SocialProviderType } }
) {
  const url = new URL(request.url);
  const search_params = Object.fromEntries(url.searchParams.entries());

  if (search_params.code) {
    const response = await AuthApi.exchangeSocialOauthCode(
      params.provider,
      search_params.code,
      `${process.env.APP_URL}${url.pathname}`
    );

    if (response?.token) {
      setServerSession(response.token);
    }
  }

  return redirect("/");
}
