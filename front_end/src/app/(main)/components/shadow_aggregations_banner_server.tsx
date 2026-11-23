import { cookies } from "next/headers";

import { SHADOW_AGGREGATIONS_COOKIE } from "@/constants/questions";

import { ShadowAggregationsBannerClient } from "./shadow_aggregations_banner_client";

export const ShadowAggregationsBanner = async () => {
  const cookieStore = await cookies();
  const enabled = cookieStore.get(SHADOW_AGGREGATIONS_COOKIE)?.value === "true";

  return <ShadowAggregationsBannerClient enabled={enabled} />;
};
