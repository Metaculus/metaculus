import { ApiService } from "@/services/api/api_service";
import {
  ContributionDetails,
  LeaderboardDetails,
  LeaderboardType,
  MedalEntry,
  MedalRanksEntry,
} from "@/types/scoring";
import { encodeQueryParams } from "@/utils/navigation";

type ProjectContributionsParams = {
  type: "project";
  for_user: number;
  project: number;
  primary?: boolean;
};
type GlobalContributionsParams = {
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

class LeaderboardApi extends ApiService {
  async getGlobalLeaderboard(
    startTime: string | null = null,
    endTime: string | null = null,
    leaderboardType: string | null = null,
    name: string | null = null
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
    if (name) {
      params.append("name", name);
    }
    const url = `/leaderboards/global/${params.toString() ? `?${params.toString()}` : ""}`;
    return await this.get<LeaderboardDetails>(url);
  }

  async getProjectLeaderboard(
    projectId: number,
    endpointParams: URLSearchParams | null = null
  ): Promise<LeaderboardDetails[] | null> {
    // TODO: make paginated
    const params = endpointParams ?? new URLSearchParams();
    const url = `/leaderboards/project/${projectId}/${params.toString() ? `?${params.toString()}` : ""}`;
    return await this.get<LeaderboardDetails[]>(url);
  }

  async getUserMedals(userId: number) {
    return await this.get<MedalEntry[]>(`/medals/?userId=${userId}`);
  }

  async getUserMedalRanks(userId: number) {
    return await this.get<MedalRanksEntry[]>(`/medal_ranks/?userId=${userId}`);
  }

  async getContributions(
    params: ContributionsRequestParams
  ): Promise<ContributionDetails> {
    const { type, ...requestParams } = params;
    const encodedParams = encodeQueryParams(requestParams);
    return await this.get<ContributionDetails>(
      `/medals/contributions/${encodedParams}`
    );
  }
}

export default LeaderboardApi;
