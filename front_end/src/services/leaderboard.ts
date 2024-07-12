import { LeaderboardDetails, MedalEntry } from "@/types/scoring";
import { get } from "@/utils/fetch";

class LeaderboardApi {
  static async getGlobalLeaderboard(
    startTime: string | null = null,
    endTime: string | null = null,
    leaderboardType: string | null = null
  ): Promise<LeaderboardDetails> {
    // TODO: make paginated
    const params = new URLSearchParams();
    if (startTime) {
      params.append("startTime", startTime.toString());
    }
    if (endTime) {
      params.append("endTime", endTime.toString());
    }
    if (leaderboardType) {
      params.append("leaderboardType", leaderboardType);
    }
    const url = `/leaderboards/global/${params.toString() ? `?${params.toString()}` : ""}`;
    return await get<LeaderboardDetails>(url);
  }

  static async getProjectLeaderboard(
    projectId: number,
    leaderboardType: string | null = null,
    leaderboardName: string | null = null
  ): Promise<LeaderboardDetails | null> {
    try {
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
    } catch (err) {
      console.error("Error getting project leaderboard:", err);
      return null;
    }
  }

  static async getUserMedals(userId: number) {
    return await get<MedalEntry[]>(`/medals?userId=${userId}`);
  }
}

export default LeaderboardApi;
