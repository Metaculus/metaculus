"use server";

import ProjectsApi, { CommunityUpdateParams } from "@/services/projects";
import { revalidatePath } from "next/cache";

export async function updateCommunity(id: number, data: CommunityUpdateParams) {
  const response = await ProjectsApi.updateCommunity(id, data);
  revalidatePath(`/community/${data.slug}/settings`);
  return response;
}
