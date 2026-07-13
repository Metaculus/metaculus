import { redirect } from "next/navigation";

import ServerProfileApi from "@/services/api/profile/profile.server";
import { SearchParams } from "@/types/navigation";

import { MEDALS_USER_FILTER } from "./search_params";

// this page is retired in favor of /accounts/profile/[id]/medals/,
// kept only as a redirect for old links
export default async function Medals(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;

  let userId: number | null;
  if (
    searchParams[MEDALS_USER_FILTER] &&
    !isNaN(Number(searchParams[MEDALS_USER_FILTER]))
  ) {
    userId = Number(searchParams[MEDALS_USER_FILTER]);
  } else {
    const profile = await ServerProfileApi.getMyProfile();
    userId = profile?.id ?? null;
  }

  if (!userId) {
    redirect("/leaderboard/");
  }
  redirect(`/accounts/profile/${userId}/medals/`);
}
