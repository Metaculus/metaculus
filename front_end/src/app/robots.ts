import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  let allowRules: MetadataRoute.Robots["rules"] = {
    allow: "/",
  };

  if (process.env.PUBLIC_DISALLOW_ALL_BOTS === "true") {
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
