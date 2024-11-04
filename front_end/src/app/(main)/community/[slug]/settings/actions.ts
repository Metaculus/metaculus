"use server";

import ProjectsApi, { CommunityUpdateParams } from "@/services/projects";

export async function updateCommunity(id: number, data: CommunityUpdateParams) {
  return await ProjectsApi.updateCommunity(id, data);
}
