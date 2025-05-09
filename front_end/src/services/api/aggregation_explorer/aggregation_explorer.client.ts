import { clientFetcher } from "@/utils/core/fetch/fetch.client";

import AggregationExplorerApi from "./aggregation_explorer.shared";

const ClientAggregationExplorerApi = new AggregationExplorerApi(clientFetcher);
export default ClientAggregationExplorerApi;
