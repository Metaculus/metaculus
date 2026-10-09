import ServerProfileApi from "@/services/api/profile/profile.server";
import { SearchParams } from "@/types/navigation";
import { ApiError } from "@/utils/core/errors";

import ChangeEmailClient, { ChangeEmailCheck, SignInForm } from "./client";

async function checkToken(token: string): Promise<ChangeEmailCheck> {
  try {
    const { new_email } = await ServerProfileApi.checkEmailChange(token);
    return { status: "valid", newEmail: new_email };
  } catch (err) {
    if (!ApiError.isApiError(err)) throw err;
    return { status: "error", errors: err.data };
  }
}

export default async function ChangeEmailPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const token =
    typeof searchParams.token === "string" ? searchParams.token : "";
  const user = await ServerProfileApi.getMyProfile();

  if (!user) return <SignInForm />;

  return (
    <ChangeEmailClient
      token={token}
      user={user}
      check={await checkToken(token)}
    />
  );
}
