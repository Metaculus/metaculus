import { LeaderboardDetails } from "@/types/scoring";
import { get } from "@/utils/fetch";

class LeaderboardApi {
  static async getLeaderboard(
    projectId: number,
    leaderboardType: string | null = null
  ): Promise<LeaderboardDetails> {
    // TODO: make paginated
    // TODO: add leaderboardType support
    return await get<LeaderboardDetails>(`/projects/${projectId}/leaderboard`);
  }
}

export default LeaderboardApi;
