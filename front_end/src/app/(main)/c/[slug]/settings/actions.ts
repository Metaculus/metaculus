"use server";

import { revalidatePath } from "next/cache";

import ServerProjectsApi from "@/services/api/projects/projects.server";
import { CommunityUpdateParams } from "@/services/api/projects/projects.shared";

export async function updateCommunity(id: number, data: CommunityUpdateParams) {
  const response = await ServerProjectsApi.updateCommunity(id, data);
  revalidatePath(`/c/${data.slug}/settings`);
  return response;
}
