import { ApiService } from "@/services/api/api_service";
import { PaginatedPayload, PaginationParams } from "@/types/fetch";
import { ProjectPermissions } from "@/types/post";
import {
  Category,
  Community,
  NewsCategory,
  ProjectVisibility,
  Tag,
  Topic,
  Tournament,
  TournamentMember,
  TournamentPreview,
} from "@/types/projects";
import { LeaderboardDetails } from "@/types/scoring";
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
  visibility?: ProjectVisibility;
};

class ProjectsApi extends ApiService {
  async getTopics(): Promise<Topic[]> {
    return await this.get<Topic[]>("/projects/topics/");
  }

  async getCategories(): Promise<Category[]> {
    return await this.get<Category[]>("/projects/categories/");
  }

  async getNewsCategories(): Promise<NewsCategory[]> {
    return await this.get<NewsCategory[]>("/projects/news-categories/");
  }

  async getTags(params?: TagsParams): Promise<Tag[]> {
    const queryParams = encodeQueryParams(params ?? {});

    return await this.get<Tag[]>(`/projects/tags/${queryParams}`);
  }

  async getSiteMain(): Promise<Tournament> {
    return await this.get<Tournament>("/projects/site_main/", {
      next: { revalidate: 3600 },
    });
  }

  async getTournaments(
    params?: TournamentFilterParams
  ): Promise<TournamentPreview[]> {
    const queryParams = encodeQueryParams(params ?? {});

    return await this.get<TournamentPreview[]>(
      `/projects/tournaments/${queryParams}`
    );
  }

  async getTournament(slug: string | number): Promise<Tournament | null> {
    return await this.get<Tournament>(`/projects/tournaments/${slug}/`);
  }

  async getProjectLeaderboard(
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
    return this.get<LeaderboardDetails>(
      `/projects/${projectId}/leaderboard/${queryParams}`
    );
  }

  async getMembers(projectId: number): Promise<TournamentMember[]> {
    return this.get(`/projects/${projectId}/members/`);
  }

  async getCommunities(
    params?: CommunitiesParams
  ): Promise<PaginatedPayload<Community>> {
    const queryParams = encodeQueryParams(params ?? {});

    return await this.get<PaginatedPayload<Community>>(
      `/projects/communities/${queryParams}`
    );
  }

  async getCommunity(slug: string): Promise<Community> {
    return this.get<Community>(`/projects/communities/${slug}/`);
  }
}

export default ProjectsApi;
