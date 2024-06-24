import { ProjectPermissions } from "@/types/post";
import { Category, Tag, Topic, Tournament } from "@/types/projects";
import { del, get, patch, post } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/query_params";

export type TagsParams = {
  search?: string;
};

class ProjectsApi {
  static async getTopics(): Promise<Topic[]> {
    try {
      return await get<Topic[]>("/projects/topics");
    } catch (err) {
      console.error("Error getting topics:", err);
      return [];
    }
  }

  static async getCategories(): Promise<Category[]> {
    try {
      return await get<Category[]>("/projects/categories");
    } catch (err) {
      console.error("Error getting categories:", err);
      return [];
    }
  }

  static async getTags(params?: TagsParams): Promise<Tag[]> {
    const queryParams = encodeQueryParams(params ?? {});

    try {
      return await get<Tag[]>(`/projects/tags${queryParams}`);
    } catch (err) {
      console.error("Error getting tags:", err);
      return [];
    }
  }

  static async getTournaments(): Promise<Tournament[]> {
    try {
      return await get<Tournament[]>("/projects/tournaments");
    } catch (err) {
      console.error("Error getting tournaments:", err);
      return [];
    }
  }

  static async getSlugTournament(slug: string): Promise<Tournament | null> {
    try {
      return await get<Tournament>(`/projects/tournaments/${slug}`);
    } catch (err) {
      console.error("Error getting tournament:", err);
      return null;
    }
  }

  static async inviteUsers(
    projectId: number,
    usernames: string[]
  ): Promise<null> {
    return post<null, { usernames: string[] }>(
      `/projects/${projectId}/members/invite`,
      {
        usernames,
      }
    );
  }

  static async deleteMember(
    projectId: number,
    userId: number
  ): Promise<Tournament | null> {
    return del<null>(`/projects/${projectId}/members/${userId}`);
  }

  static async updateMember(
    projectId: number,
    userId: number,
    payload: { permission: ProjectPermissions }
  ): Promise<Tournament | null> {
    return patch<null, { permission: ProjectPermissions }>(
      `/projects/${projectId}/members/${userId}`,
      payload
    );
  }
}

export default ProjectsApi;
