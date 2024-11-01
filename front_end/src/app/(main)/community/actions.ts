"use server";

import ProjectsApi, { CommunitiesParams } from "@/services/projects";

export async function fetchCommunities(params?: CommunitiesParams) {
  const response = await ProjectsApi.getCommunities(params);

  return { communities: response.results };
}
