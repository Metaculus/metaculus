import {
  ContributionDetails,
  LeaderboardDetails,
  LeaderboardType,
  MedalEntry,
  MedalRanksEntry,
} from "@/types/scoring";
import { get } from "@/utils/core/fetch";
import { encodeQueryParams } from "@/utils/navigation";

export type ProjectContributionsParams = {
  type: "project";
  for_user: number;
  project: number;
  primary?: boolean;
};
export type GlobalContributionsParams = {
  type: "global";
  for_user: number;
  start_time: string;
  end_time: string;
  score_type: LeaderboardType;
  primary?: boolean;
};
type ContributionsRequestParams = { for_user: number } & (
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
      params.append("start_time", startTime.toString());
    }
    if (endTime) {
      params.append("end_time", endTime.toString());
    }
    if (leaderboardType) {
      params.append("score_type", leaderboardType);
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
      params.append("score_type", leaderboardType);
    }
    if (leaderboardName) {
      params.append("name", leaderboardName);
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
