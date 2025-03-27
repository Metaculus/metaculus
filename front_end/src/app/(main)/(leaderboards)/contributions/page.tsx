import { redirect } from "next/navigation";
import invariant from "ts-invariant";

import { SearchParams } from "@/types/navigation";

import { CONTRIBUTIONS_USER_FILTER } from "./search_params";
import { getContributionParams } from "../contributions/helpers/filters";
import { SCORING_CATEGORY_FILTER } from "../search_params";

export default async function Contributions(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const params = getContributionParams(searchParams);
  invariant(params.userId, "User ID is required");
  const remainingSearchParams = new URLSearchParams(
    searchParams as Record<string, string>
  );
  remainingSearchParams.delete(SCORING_CATEGORY_FILTER);
  remainingSearchParams.delete(CONTRIBUTIONS_USER_FILTER);

  const queryString = remainingSearchParams.toString();
  redirect(
    `/contributions/${params.category}/${params.userId}${queryString ? `?${queryString}` : ""}`
  );
}
