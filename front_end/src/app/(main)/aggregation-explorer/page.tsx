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
  const questionData =
    await AggregationExplorerAPI.getAggregations(searchParams);

  return (
    <Suspense fallback={<LoadingIndicator />}>
      <div>AggregationExplorer</div>
    </Suspense>
  );
}
