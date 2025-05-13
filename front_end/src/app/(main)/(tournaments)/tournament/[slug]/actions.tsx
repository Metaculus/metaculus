"use server";

import { revalidatePath } from "next/cache";

import ProjectsApi from "@/services/projects";
import { ProjectPermissions } from "@/types/post";
import { ApiError } from "@/utils/core/errors";

export async function getProjectMembers(projectId: number) {
  return ProjectsApi.getMembers(projectId);
}

export async function inviteProjectUsers(
  projectId: number,
  usernames: string[]
) {
  try {
    const response = await ProjectsApi.inviteUsers(projectId, usernames);

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
    const response = await ProjectsApi.deleteMember(projectId, userId);

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
    await ProjectsApi.updateMember(projectId, userId, { permission });

    revalidatePath("/");
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function subscribeProject(projectId: number) {
  return ProjectsApi.subscribe(projectId);
}

export async function unsubscribeProject(projectId: number) {
  return ProjectsApi.unsubscribe(projectId);
}
