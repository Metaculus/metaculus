import { LeaderboardDetails } from "@/types/scoring";
import { get } from "@/utils/fetch";

class LeaderboardApi {
  static async getGlobalLeaderboard(
    leaderboardName: string | null = null
  ): Promise<LeaderboardDetails> {
    // TODO: make paginated
    const params = new URLSearchParams();
    if (leaderboardName) {
      params.append("leaderboardName", leaderboardName);
    }
    const url = `/leaderboards/global/${params.toString() ? `?${params.toString()}` : ""}`;
    return await get<LeaderboardDetails>(url);
  }

  static async getProjectLeaderboard(
    projectId: number,
    leaderboardType: string | null = null,
    leaderboardName: string | null = null
  ): Promise<LeaderboardDetails> {
    // TODO: make paginated
    const params = new URLSearchParams();
    if (leaderboardType) {
      params.append("leaderboardType", leaderboardType);
    }
    if (leaderboardName) {
      params.append("leaderboardName", leaderboardName);
    }

    const url = `/leaderboards/project/${projectId}/${params.toString() ? `?${params.toString()}` : ""}`;
    return await get<LeaderboardDetails>(url);
  }
}

export default LeaderboardApi;
