"use server";

import { revalidatePath } from "next/cache";

import ProjectsApi from "@/services/projects";
import { FetchError } from "@/types/fetch";
import { ProjectPermissions } from "@/types/post";

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
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function deleteProjectMember(projectId: number, userId: number) {
  try {
    const response = await ProjectsApi.deleteMember(projectId, userId);

    revalidatePath("/tournament/[slug]");

    return response;
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
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
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}
