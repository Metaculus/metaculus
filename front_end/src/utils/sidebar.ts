import { SidebarItem, SidebarMenuItem } from "@/types/sidebar";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getPostLink, getProjectLink } from "@/utils/navigation";

const normalizePathname = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;

const isSidebarItemActive = (currentUrl: string, itemUrl: string): boolean => {
  // Parse-only base URL. This is not used for navigation; it just lets URL handle relative URLs.
  const current = new URL(currentUrl, "https://metaculus.local");
  const item = new URL(itemUrl, "https://metaculus.local");
  const currentPathname = normalizePathname(current.pathname);
  const itemPathname = normalizePathname(item.pathname);

  if (item.searchParams.size > 0) {
    return (
      currentPathname === itemPathname &&
      Array.from(item.searchParams).every(
        ([key, value]) => current.searchParams.get(key) === value
      )
    );
  }

  return currentPathname.startsWith(itemPathname);
};

export const convertSidebarItem = (
  { name, post, project, section, url, emoji }: SidebarItem,
  fullPathname?: string
): SidebarMenuItem => {
  const itemUrl: string = post
    ? getPostLink(post)
    : project
      ? getProjectLink(project)
      : url;

  const itemName = name || post?.title || project?.name || "";

  return {
    name: itemName,
    emoji: emoji || project?.emoji,
    section,
    url: itemUrl,
    isActive: fullPathname
      ? isSidebarItemActive(fullPathname, itemUrl)
      : undefined,
    onClick: () => {
      sendAnalyticsEvent("sidebarClick", {
        event_category: itemName,
      });
    },
  };
};
