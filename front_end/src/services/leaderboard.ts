import {
  ContributionDetails,
  LeaderboardDetails,
  LeaderboardType,
  MedalEntry,
  MedalRanksEntry,
} from "@/types/scoring";
import { get } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/navigation";

export type ProjectContributionsParams = {
  type: "project";
  userId: number;
  projectId: number;
};
export type GlobalContributionsParams = {
  type: "global";
  userId: number;
  startTime: string;
  endTime: string;
  leaderboardType: LeaderboardType;
};
type ContributionsRequestParams = { userId: number } & (
  | ProjectContributionsParams
  | GlobalContributionsParams
);

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

  static async getUserMedals(userId: number) {
    return await get<MedalEntry[]>(`/medals/?userId=${userId}`);
  }

  static async getUserMedalRanks(userId: number) {
    return await get<MedalRanksEntry[]>(`/medal_ranks/?userId=${userId}`);
  }

  static async getContributions(
    params: ContributionsRequestParams
  ): Promise<ContributionDetails> {
    const { type, ...requestParams } = params;
    const encodedParams = encodeQueryParams(requestParams);
    return await get<ContributionDetails>(
      `/medals/contributions/${encodedParams}`
    );
  }
}

export default LeaderboardApi;
