import { Suspense } from "react";

import LoadingIndicator from "@/components/ui/loading_indicator";
import AggregationExplorerAPI, {
  AggregationExplorerParams,
} from "@/services/aggregation_explorer";

export default async function AggregationExplorer({
  searchParams,
}: {
  searchParams: AggregationExplorerParams;
}) {
  const data = await AggregationExplorerAPI.getAggregations(searchParams);

  //f dasfdafsd
  //f dasfdafsd
  //f dasfdafsd
  //f dasfdafsd

  console.log(data);

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <div>AggregationExplorer</div>
    </Suspense>
  );
}
