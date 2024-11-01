import { PaginatedPayload, PaginationParams } from "@/types/fetch";
import { ProjectPermissions } from "@/types/post";
import {
  Category,
  Community,
  Tag,
  Topic,
  Tournament,
  TournamentMember,
  TournamentPreview,
} from "@/types/projects";
import { LeaderboardDetails } from "@/types/scoring";
import { del, get, patch, post, put } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/navigation";

export type TagsParams = {
  search?: string;
};

export type TournamentFilterParams = {
  // Min permission
  permission?: ProjectPermissions;
  show_on_homepage?: boolean;
};

export type CommunitiesParams = PaginationParams & {
  is_subscribed?: boolean;
  ids?: number[];
};

export type CommunityUpdateParams = {
  name?: string;
  slug?: string;
  description?: string;
  default_permission?: ProjectPermissions | null;
  unlisted?: boolean;
};

class ProjectsApi {
  static async getTopics(): Promise<Topic[]> {
    return await get<Topic[]>("/projects/topics/", {
      next: { revalidate: 3600 },
    });
  }

  static async getCategories(): Promise<Category[]> {
    return await get<Category[]>("/projects/categories/");
  }

  static async getTags(params?: TagsParams): Promise<Tag[]> {
    const queryParams = encodeQueryParams(params ?? {});

    return await get<Tag[]>(`/projects/tags/${queryParams}`);
  }

  static async getSiteMain(): Promise<Tournament> {
    return await get<Tournament>("/projects/site_main/", {
      next: { revalidate: 3600 },
    });
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
    return await get<Tournament>(`/projects/tournaments/${slug}/`);
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
      `/projects/${projectId}/leaderboard/${queryParams}`
    );
  }

  static async inviteUsers(
    projectId: number,
    usernames: string[]
  ): Promise<null> {
    return post<null, { usernames: string[] }>(
      `/projects/${projectId}/members/invite/`,
      {
        usernames,
      }
    );
  }

  static async getMembers(projectId: number): Promise<TournamentMember[]> {
    return get(`/projects/${projectId}/members/`);
  }

  static async deleteMember(
    projectId: number,
    userId: number
  ): Promise<Tournament | null> {
    return del<null>(`/projects/${projectId}/members/${userId}/`);
  }

  static async updateMember(
    projectId: number,
    userId: number,
    payload: { permission: ProjectPermissions }
  ): Promise<Tournament | null> {
    return patch<null, { permission: ProjectPermissions }>(
      `/projects/${projectId}/members/${userId}/`,
      payload
    );
  }

  static async subscribe(projectId: number) {
    return post(`/projects/${projectId}/subscribe/`, {});
  }

  static async unsubscribe(projectId: number) {
    return post(`/projects/${projectId}/unsubscribe/`, {});
  }

  static async toggleAddPostsToMainFeed(projectId: number) {
    return post(`/projects/${projectId}/toggle_add_posts_to_main_feed/`, {});
  }

  static async getCommunities(
    params?: CommunitiesParams
  ): Promise<PaginatedPayload<Community>> {
    const queryParams = encodeQueryParams(params ?? {});

    return await get<PaginatedPayload<Community>>(
      `/projects/communities/${queryParams}`
    );
  }

  static async getCommunity(slug: string): Promise<Community> {
    return get<Community>(`/projects/communities/${slug}/`);
  }

  static async updateCommunity(
    id: number,
    params: CommunityUpdateParams
  ): Promise<Community> {
    return put(`/projects/communities/${id}/update/`, params);
  }
}

export default ProjectsApi;
