import { LeaderboardDetails } from "@/types/scoring";
import { get } from "@/utils/fetch";

class LeaderboardApi {
  static async getLeaderboard(
    projectId: number,
    leaderboardType: string | null = null
  ): Promise<LeaderboardDetails> {
    // TODO: make paginated
    return await get<LeaderboardDetails>(
      `/projects/${projectId}/leaderboard` +
        (leaderboardType ? `?${leaderboardType}` : "")
    );
  }
}

export default LeaderboardApi;
