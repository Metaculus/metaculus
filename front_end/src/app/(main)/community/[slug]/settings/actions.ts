"use server";

import { revalidatePath } from "next/cache";

import ProjectsApi, { CommunityUpdateParams } from "@/services/projects";

export async function updateCommunity(id: number, data: CommunityUpdateParams) {
  const response = await ProjectsApi.updateCommunity(id, data);
  revalidatePath(`/community/${data.slug}/settings`);
  return response;
}
