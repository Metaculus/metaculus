import { get } from "@/utils/fetch";

class LeaderboardApi {
  static async getLeaderboard(
    projectId: number,
    leaderboardType: string | null = null
  ): Promise<Response> {
    // TODO: make paginated
    // TODO: add leaderboardType support
    return await get<Response>(`/projects/${projectId}/leaderboard`);
  }
}

export default LeaderboardApi;
