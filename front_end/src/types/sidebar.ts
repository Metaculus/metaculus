import { ReactNode } from "react";

import { Post } from "@/types/post";
import { Project } from "@/types/projects";

export type SidebarSectionType = null | "hot_topics" | "hot_categories";

type BaseSidebarItem = {
  id: string;
  name: string;
  emoji: string;
  section?: SidebarSectionType;
};

type SidebarWithProject = BaseSidebarItem & {
  project: Project & { emoji?: string };
  post?: never;
  url?: never;
};

type SidebarWithPost = BaseSidebarItem & {
  post: Pick<Post, "id" | "slug" | "title" | "projects"> & {
    notebook?: { id: number };
    group_of_questions?: { id: number };
    conditional?: { id: number };
    question?: { id: number };
  };
  project?: never;
  url?: never;
};

type SidebarWithUrl = BaseSidebarItem & {
  url: string;
  post?: never;
  project?: never;
};

export type SidebarItem = SidebarWithProject | SidebarWithPost | SidebarWithUrl;

export type SidebarMenuItem = {
  name: string;
  emoji: string | ReactNode;
  section?: SidebarSectionType;
  url: string;
  isActive?: boolean;
  onClick?: () => void;
};
