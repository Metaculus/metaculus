import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CSRF_COOKIE_NAME } from "@/constants/csrf";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { SocialProviderType } from "@/types/auth";
import { SearchParams } from "@/types/navigation";
import { ensureRelativeRedirect } from "@/utils/navigation";

import SocialAuthClient from "./client";

export default async function SocialAuthPage(props: {
  params: Promise<{ provider: SocialProviderType }>;
  searchParams: Promise<SearchParams>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  // Redirect to homepage if already authenticated
  const user = await ServerProfileApi.getMyProfile().catch(() => null);
  if (user) {
    redirect("/");
  }

  // Validate OAuth parameters
  if (!searchParams.state || !searchParams.code) {
    throw new Error("Missing OAuth parameters");
  }

  // Parse and validate state
  let stateData;
  try {
    stateData = JSON.parse(searchParams.state as string);
  } catch {
    throw new Error("Invalid OAuth state format");
  }

  // Validate CSRF token
  const cookieStore = await cookies();
  const csrfToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!csrfToken || stateData.nonce !== csrfToken) {
    throw new Error("Invalid OAuth CSRF state");
  }

  const redirectUrl = ensureRelativeRedirect(stateData.redirect);

  return (
    <SocialAuthClient
      provider={params.provider}
      code={searchParams.code as string}
      redirectUrl={redirectUrl}
    />
  );
}
