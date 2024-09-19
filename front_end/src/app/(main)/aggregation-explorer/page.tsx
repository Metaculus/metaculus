import { SearchParams } from "@/types/navigation";
import Explorer from "./components/explorer";

export default function AggregationExplorer({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto mt-4 min-h-min w-full max-w-5xl flex-auto px-0 sm:px-2 md:px-3">
      <h1 className="mb-5 mt-20 text-balance text-center text-4xl text-blue-800 dark:text-blue-800-dark sm:text-5xl sm:tracking-tight md:text-6xl">
        Aggregation Explorer
      </h1>
      <Explorer searchParams={searchParams} />
    </main>
  );
}
