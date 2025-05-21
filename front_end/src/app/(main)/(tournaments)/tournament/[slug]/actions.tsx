"use server";

import { revalidatePath } from "next/cache";

import ServerProjectsApi from "@/services/api/projects/projects.server";
import { ProjectPermissions } from "@/types/post";
import { ApiError } from "@/utils/core/errors";

export async function inviteProjectUsers(
  projectId: number,
  usernames: string[]
) {
  try {
    const response = await ServerProjectsApi.inviteUsers(projectId, usernames);

    revalidatePath("/tournament/[slug]");

    return response;
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function deleteProjectMember(projectId: number, userId: number) {
  try {
    const response = await ServerProjectsApi.deleteMember(projectId, userId);

    revalidatePath("/tournament/[slug]");

    return response;
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function updateMember(
  projectId: number,
  userId: number,
  permission: ProjectPermissions
) {
  try {
    await ServerProjectsApi.updateMember(projectId, userId, { permission });

    revalidatePath("/");
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function subscribeProject(projectId: number) {
  return ServerProjectsApi.subscribe(projectId);
}

export async function unsubscribeProject(projectId: number) {
  return ServerProjectsApi.unsubscribe(projectId);
}
