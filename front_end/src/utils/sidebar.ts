import { SidebarItem, SidebarMenuItem } from "@/types/sidebar";
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

  return {
    name: name || post?.title || project?.name || "",
    emoji: emoji || project?.emoji,
    section,
    url: itemUrl,
    isActive: fullPathname ? fullPathname.startsWith(itemUrl) : undefined,
  };
};
