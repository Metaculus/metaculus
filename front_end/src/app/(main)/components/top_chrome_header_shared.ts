import type { Community } from "@/types/projects";

export type TopChromeHeaderConfig =
  | {
      type: "community";
      community: Community | null;
      alwaysShowName?: boolean;
    }
  | {
      type: "default";
    };

export type TopChromeHeaderState = {
  routeKey: string;
  header: TopChromeHeaderConfig;
};

export const normalizeTopChromeRouteKey = (pathname: string) => {
  const normalizedPathname = pathname.replace(/\/+$/, "");

  return normalizedPathname || "/";
};
