import { SearchParams } from "@/types/navigation";

import ChangeEmailClient from "./client";

export default async function ChangeEmailPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams.token as string;

  if (!token) {
    throw new Error("Missing token parameter");
  }

  return <ChangeEmailClient token={token} />;
}
