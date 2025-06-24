import "server-only";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

import LeaderboardApi from "./leaderboard.shared";

const ServerLeaderboardApi = new LeaderboardApi(serverFetcher);
export default ServerLeaderboardApi;
