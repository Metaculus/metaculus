import { CONTRIBUTIONS_USER_FILTER } from "@/app/(main)/(leaderboards)/contributions/search_params";
import { SearchParams } from "@/types/navigation";
import { CategoryKey } from "@/types/scoring";

import {
  SCORING_CATEGORY_FILTER,
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "../../search_params";

type ContributionParams = {
  userId?: number;
  category: CategoryKey;
  year: string;
  duration: string;
};
export function getContributionParams(searchParams: SearchParams) {
  const params: ContributionParams = {
    // used for backwards compatibility redirect
    // currently this value is extracted from URL param
    category: getSearchParamValue<CategoryKey>(
      searchParams,
      SCORING_CATEGORY_FILTER,
      "baseline"
    ),
    year: getSearchParamValue(searchParams, SCORING_YEAR_FILTER, "2023"),
    duration: getSearchParamValue(searchParams, SCORING_DURATION_FILTER, "1"),
  };

  // used for backwards compatibility redirect
  // currently this value is extracted from URL param
  const userParam = searchParams[CONTRIBUTIONS_USER_FILTER];
  if (userParam && typeof userParam === "string" && !isNaN(Number(userParam))) {
    params.userId = Number(userParam);
  }

  return params;
}

const getSearchParamValue = <T extends string>(
  params: SearchParams,
  key: string,
  defaultValue: T
): T => {
  const value = params[key];
  if (value && typeof value === "string") {
    return value as T;
  }
  return defaultValue;
};
