import type { MetadataRoute } from "next";

import { getPublicSettings } from "@/utils/public_settings.server";
export const dynamic = "force-dynamic";

const { PUBLIC_DISALLOW_ALL_BOTS } = getPublicSettings();

export default function robots(): MetadataRoute.Robots {
  let allowRules: MetadataRoute.Robots["rules"] = {
    allow: "/",
  };

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
