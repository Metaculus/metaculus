import { ApiService } from "@/services/api/api_service";
import {
  FetchOptions,
  PaginatedPayload,
  PaginationParams,
} from "@/types/fetch";
import { Post, ProjectPermissions } from "@/types/post";
import {
  Category,
  Community,
  FeedProjectTile,
  NewsCategory,
  ProjectVisibility,
  Tournament,
  TournamentMember,
  TournamentPreview,
  LeaderboardTag,
} from "@/types/projects";
import { encodeQueryParams } from "@/utils/navigation";

export type TournamentFilterParams = {
  // Min permission
  permission?: ProjectPermissions;
  show_on_homepage?: boolean;
  show_on_services_page?: boolean;
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
  async getCategories(): Promise<Category[]> {
    return await this.get<Category[]>("/projects/categories/");
  }

  async getHomepageCategories(): Promise<(Category & { posts: Post[] })[]> {
    return await this.get<(Category & { posts: Post[] })[]>(
      `/projects/homepage_categories/`
    );
  }

  async getNewsCategories(): Promise<NewsCategory[]> {
    return await this.get<NewsCategory[]>("/projects/news-categories/");
  }

  async getLeaderboardTags(): Promise<LeaderboardTag[]> {
    return await this.get(`/projects/leaderboard-tags/`);
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
      `/projects/tournaments/${queryParams}`,
      { next: { revalidate: 60 } }
    );
  }

  async getTournament(
    slug: string | number,
    fetchOptions?: FetchOptions
  ): Promise<Tournament | null> {
    return await this.get<Tournament>(
      `/projects/tournaments/${slug}/`,
      fetchOptions
    );
  }

  async getMinibenchTournaments(): Promise<TournamentPreview[]> {
    return await this.get<TournamentPreview[]>("/projects/minibenches/");
  }

  async getMembers(projectId: number): Promise<TournamentMember[]> {
    return this.get(`/projects/${projectId}/members/`);
  }

  async getFeedTiles(): Promise<FeedProjectTile[]> {
    return await this.get<FeedProjectTile[]>("/projects/feed-tiles/");
  }

  async getCommunities(
    params?: CommunitiesParams
  ): Promise<PaginatedPayload<Community>> {
    const queryParams = encodeQueryParams(params ?? {});

    return await this.get<PaginatedPayload<Community>>(
      `/projects/communities/${queryParams}`
    );
  }

  async getCommunity(
    slug: string,
    fetchOptions?: FetchOptions
  ): Promise<Community> {
    return this.get<Community>(`/projects/communities/${slug}/`, fetchOptions);
  }
}

export default ProjectsApi;
