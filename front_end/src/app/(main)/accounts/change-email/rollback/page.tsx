import ServerAuthApi from "@/services/api/auth/auth.server";
import { SearchParams } from "@/types/navigation";
import { ApiError } from "@/utils/core/errors";

import EmailRollbackClient, { EmailRollbackCheck } from "./client";

async function checkToken(token: string): Promise<EmailRollbackCheck> {
  try {
    const { old_email } = await ServerAuthApi.checkEmailChangeRollback(token);
    return { status: "valid", oldEmail: old_email };
  } catch (err) {
    if (!ApiError.isApiError(err)) throw err;
    return { status: "error", errors: err.data };
  }
}

export default async function EmailRollbackPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const token =
    typeof searchParams.token === "string" ? searchParams.token : "";

  return <EmailRollbackClient token={token} check={await checkToken(token)} />;
}
