"use server";

import ProjectsApi, { CommunitiesParams } from "@/services/projects";

export async function fetchCommunities(params?: CommunitiesParams) {
  const response = await ProjectsApi.getCommunities(params);

  return { communities: response.results };
}

export async function fetchMoreCommunities(offset: number, limit: number) {
  const response = await ProjectsApi.getCommunities({ offset, limit });

  return {
    newCommunities: response.results,
    hasNextPage: !!response.next && response.results.length >= limit,
  };
}
