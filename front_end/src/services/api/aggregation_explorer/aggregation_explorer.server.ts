import "server-only";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

import AggregationExplorerApi from "./aggregation_explorer.shared";

const ServerAggregationsExplorerApi = new AggregationExplorerApi(serverFetcher);
export default ServerAggregationsExplorerApi;
