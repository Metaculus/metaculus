import { PostSubscription, ProjectPermissions } from "@/types/post";
import {
  Category,
  Tag,
  Topic,
  Tournament,
  TournamentMember,
  TournamentPreview,
} from "@/types/projects";
import { LeaderboardDetails } from "@/types/scoring";
import { del, get, patch, post } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/navigation";

export type TagsParams = {
  search?: string;
};

export type TournamentFilterParams = {
  // Min permission
  permission?: ProjectPermissions;
  show_on_homepage?: boolean;
};

class ProjectsApi {
  static async getTopics(): Promise<Topic[]> {
    return await get<Topic[]>("/projects/topics");
  }

  static async getCategories(): Promise<Category[]> {
    return await get<Category[]>("/projects/categories");
  }

  static async getTags(params?: TagsParams): Promise<Tag[]> {
    const queryParams = encodeQueryParams(params ?? {});

    return await get<Tag[]>(`/projects/tags${queryParams}`);
  }

  static async getSiteMain(): Promise<Tournament> {
    return await get<Tournament>("/projects/site_main");
  }

  static async getTournaments(
    params?: TournamentFilterParams
  ): Promise<TournamentPreview[]> {
    const queryParams = encodeQueryParams(params ?? {});

    return await get<TournamentPreview[]>(
      `/projects/tournaments/${queryParams}`
    );
  }

  static async getSlugTournament(slug: string): Promise<Tournament | null> {
    return await get<Tournament>(`/projects/tournaments/${slug}`);
  }

  static async getProjectLeaderboard(
    projectId: number,
    leaderboardType: string | null = null
  ): Promise<LeaderboardDetails> {
    const queryParams = encodeQueryParams(
      leaderboardType
        ? {
            leaderboardType,
          }
        : {}
    );
    return get<LeaderboardDetails>(
      `/projects/${projectId}/leaderboard${queryParams}`
    );
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

  static async getMembers(projectId: number): Promise<TournamentMember[]> {
    return get(`/projects/${projectId}/members`);
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

  static async subscribe(projectId: number) {
    return post(`/projects/${projectId}/subscribe`, {});
  }

  static async unsubscribe(projectId: number) {
    return post(`/projects/${projectId}/unsubscribe`, {});
  }

  static async toggleAddPostsToMainFeed(projectId: number) {
    return post(`/projects/${projectId}/toggle_add_posts_to_main_feed`, {});
  }
}

export default ProjectsApi;
