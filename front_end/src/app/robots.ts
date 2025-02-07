import type { MetadataRoute } from "next";

import { getPublicSettings } from "@/utils/public-settings";
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  let allowRules: MetadataRoute.Robots["rules"] = {
    allow: "/",
  };

  const { PUBLIC_DISALLOW_ALL_BOTS } = getPublicSettings();

  if (PUBLIC_DISALLOW_ALL_BOTS) {
    allowRules = {
      disallow: "/",
    };
  }
  return {
    rules: {
      userAgent: "*",
      ...allowRules,
    },
  };
}
