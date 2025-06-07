import { SidebarItem, SidebarMenuItem } from "@/types/sidebar";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { getPostLink, getProjectLink } from "@/utils/navigation";

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
    isActive: fullPathname ? fullPathname.startsWith(itemUrl) : undefined,
    onClick: () => {
      sendAnalyticsEvent("sidebarClick", {
        event_category: itemName,
      });
    },
  };
};
