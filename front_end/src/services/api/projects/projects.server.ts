import "server-only";
import { ProjectPermissions } from "@/types/post";
import { Community, Tournament } from "@/types/projects";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

import ProjectsApi, { CommunityUpdateParams } from "./projects.shared";

class ServerProjectsApiClass extends ProjectsApi {
  async inviteUsers(projectId: number, usernames: string[]): Promise<null> {
    return this.post<null, { usernames: string[] }>(
      `/projects/${projectId}/members/invite/`,
      {
        usernames,
      }
    );
  }

  async deleteMember(
    projectId: number,
    userId: number
  ): Promise<Tournament | null> {
    return this.delete<null>(`/projects/${projectId}/members/${userId}/`);
  }

  async updateMember(
    projectId: number,
    userId: number,
    payload: { permission: ProjectPermissions }
  ): Promise<Tournament | null> {
    return this.patch<null, { permission: ProjectPermissions }>(
      `/projects/${projectId}/members/${userId}/`,
      payload
    );
  }

  async subscribe(projectId: number) {
    return this.post(`/projects/${projectId}/subscribe/`, {});
  }

  async unsubscribe(projectId: number) {
    return this.post(`/projects/${projectId}/unsubscribe/`, {});
  }

  async updateCommunity(
    id: number,
    params: CommunityUpdateParams
  ): Promise<Community> {
    return this.put(`/projects/communities/${id}/update/`, params);
  }
}

const ServerProjectsApi = new ServerProjectsApiClass(serverFetcher);
export default ServerProjectsApi;
